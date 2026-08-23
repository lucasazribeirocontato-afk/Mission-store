import crypto from "node:crypto";
import { getDatabase } from "@netlify/database";

const db = getDatabase();

function resposta(status, dados = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function assinaturaValida(req, dataId) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const signature = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  const partes = Object.fromEntries(
    signature.split(",").map((p) => {
      const [k, ...v] = p.split("=");
      return [k, v.join("=")];
    })
  );

  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifestParts = [];
  if (dataId) manifestParts.push(`id:${dataId};`);
  if (requestId) manifestParts.push(`request-id:${requestId};`);
  if (ts) manifestParts.push(`ts:${ts};`);

  const manifest = manifestParts.join("");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async (req) => {
  if (req.method !== "POST") return resposta(405, { error: "Método não permitido." });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return resposta(503, { error: "Mercado Pago não configurado." });

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const dataId = url.searchParams.get("data.id") || body?.data?.id || "";

    if (!assinaturaValida(req, dataId)) {
      return resposta(401, { error: "Webhook não autorizado." });
    }

    if ((body?.type || url.searchParams.get("type")) !== "payment") {
      return resposta(200, { received: true });
    }

    if (!dataId) return resposta(400, { error: "ID do pagamento ausente." });

    const mp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const pagamento = await mp.json().catch(() => ({}));

    if (!mp.ok || !pagamento.id) {
      console.error("Falha ao consultar pagamento no Mercado Pago:", pagamento);
      return resposta(502, { error: "Não foi possível consultar o pagamento." });
    }

    const codigo = String(pagamento.external_reference || "").trim();
    if (!codigo) return resposta(200, { received: true, ignored: true });

    const pedidos = await db.sql`
      SELECT * FROM pedidos WHERE codigo = ${codigo} LIMIT 1
    `;
    const pedido = pedidos[0];
    if (!pedido) return resposta(404, { error: "Pedido não encontrado." });

    // Idempotência: se o estoque deste pedido já foi processado, não repetir
    // a baixa nem reprocessar a confirmação, não importa quantas vezes o
    // Mercado Pago reenvie a notificação.
    if (pedido.estoque_processado) {
      return resposta(200, { received: true, already_processed: true });
    }

    const status = String(pagamento.status || "pendente");
    const statusMap = {
      approved: "aprovado",
      pending: "pendente",
      in_process: "em_processamento",
      rejected: "rejeitado",
      cancelled: "cancelado",
      refunded: "estornado",
      charged_back: "contestado",
    };
    const pagamentoStatus = statusMap[status] || status;
    const pagamentoMetodo = String(
      pagamento.payment_method_id || pagamento.payment_type_id || ""
    ).trim();

    await db.sql`
      UPDATE pedidos
      SET pagamento_id = ${String(pagamento.id)},
          pagamento_status = ${pagamentoStatus},
          pagamento_metodo = ${pagamentoMetodo || null},
          pagamento_atualizado_em = NOW(),
          atualizado_em = NOW()
      WHERE id = ${pedido.id}
    `;

    if (status !== "approved") {
      if (["rejected", "cancelled", "refunded", "charged_back"].includes(status)) {
        await db.sql`
          UPDATE pedidos
          SET status = CASE
            WHEN status = 'pendente' THEN 'cancelado'
            ELSE status
          END,
          atualizado_em = NOW()
          WHERE id = ${pedido.id}
        `;
      }
      return resposta(200, { received: true, payment_status: pagamentoStatus });
    }

    // Só consideramos aprovado quando o valor pago cobre o total do pedido.
    const valorPago = Number(pagamento.transaction_amount || pagamento.transaction_details?.total_paid_amount || 0);
    const totalPedido = Number(pedido.total || 0);
    if (valorPago + 0.001 < totalPedido) {
      return resposta(409, { error: "Pagamento aprovado com valor inferior ao pedido." });
    }

    const itens = await db.sql`
      SELECT id, produto_id, produto_nome, tamanho, quantidade
      FROM itens_pedido WHERE pedido_id = ${pedido.id} ORDER BY id ASC
    `;

    const baixas = [];

    try {
      // Pré-validação do estoque atual. Não baixa nada antes de todos passarem.
      for (const item of itens) {
        const rows = await db.sql`
          SELECT id, estoque_por_tamanho, estoque
          FROM produtos WHERE id = ${item.produto_id} LIMIT 1
        `;
        const produto = rows[0];
        const mapa = produto?.estoque_por_tamanho || {};
        const disponivel = Number(mapa[item.tamanho] || 0);

        if (!produto || disponivel < Number(item.quantidade)) {
          throw new Error(`Estoque insuficiente: produto ${item.produto_id}, tamanho ${item.tamanho}.`);
        }
      }

      for (const item of itens) {
        const atualizados = await db.sql`
          UPDATE produtos
          SET estoque_por_tamanho = jsonb_set(
                COALESCE(estoque_por_tamanho, '{}'::jsonb),
                ARRAY[${item.tamanho}],
                to_jsonb(
                  COALESCE((estoque_por_tamanho ->> ${item.tamanho})::integer, 0) - ${item.quantidade}
                )
              ),
              estoque = GREATEST(0, estoque - ${item.quantidade}),
              atualizado_em = NOW()
          WHERE id = ${item.produto_id}
            AND COALESCE((estoque_por_tamanho ->> ${item.tamanho})::integer, 0) >= ${item.quantidade}
          RETURNING id
        `;

        if (!atualizados.length) {
          throw new Error(`Estoque alterado durante a confirmação: ${item.produto_nome}.`);
        }
        baixas.push(item);
      }
    } catch (erroEstoque) {
      // Compensação para não deixar metade do pedido baixado.
      for (const item of baixas) {
        await db.sql`
          UPDATE produtos
          SET estoque_por_tamanho = jsonb_set(
                COALESCE(estoque_por_tamanho, '{}'::jsonb),
                ARRAY[${item.tamanho}],
                to_jsonb(COALESCE((estoque_por_tamanho ->> ${item.tamanho})::integer, 0) + ${item.quantidade})
              ),
              estoque = estoque + ${item.quantidade},
              atualizado_em = NOW()
          WHERE id = ${item.produto_id}
        `;
      }

      await db.sql`
        UPDATE pedidos
        SET status = 'estoque_indisponivel',
            atualizado_em = NOW()
        WHERE id = ${pedido.id}
      `;

      console.error("Pagamento aprovado, mas estoque insuficiente:", erroEstoque);
      return resposta(409, { error: "Pagamento aprovado, mas o estoque precisa de intervenção administrativa." });
    }

    await db.sql`
      UPDATE pedidos
      SET status = 'confirmado',
          pagamento_status = 'aprovado',
          estoque_processado = TRUE,
          atualizado_em = NOW()
      WHERE id = ${pedido.id}
    `;

    return resposta(200, {
      received: true,
      payment_status: "aprovado",
      order_status: "confirmado",
    });
  } catch (error) {
    console.error("Erro no webhook de pagamento:", error);
    return resposta(500, { error: "Erro ao processar webhook." });
  }
};

export const config = { path: "/api/pagamento-webhook" };
