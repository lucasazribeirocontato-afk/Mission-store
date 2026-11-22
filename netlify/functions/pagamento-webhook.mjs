import crypto from "node:crypto";
import { getDatabase } from "@netlify/database";

const db = getDatabase();

const STATUS_MAP = {
  approved: "aprovado",
  pending: "pendente",
  in_process: "em_processamento",
  rejected: "rejeitado",
  cancelled: "cancelado",
  refunded: "estornado",
  charged_back: "contestado",
};

class EstoqueInsuficienteError extends Error {}

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
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    })
  );

  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  // Segundo a documentação do Mercado Pago, IDs alfanuméricos entram
  // em minúsculo no manifesto (IDs numéricos não mudam).
  const manifestParts = [];
  if (dataId) manifestParts.push(`id:${String(dataId).toLowerCase()};`);
  if (requestId) manifestParts.push(`request-id:${requestId};`);
  manifestParts.push(`ts:${ts};`);

  const esperado = crypto
    .createHmac("sha256", secret)
    .update(manifestParts.join(""))
    .digest("hex");

  const a = Buffer.from(esperado);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Devolve ao estoque o que já tinha sido baixado (compensação).
async function restaurarEstoque(baixas) {
  for (const item of baixas) {
    try {
      await db.sql`
        UPDATE produtos
        SET estoque_por_tamanho = jsonb_set(
              COALESCE(estoque_por_tamanho, '{}'::jsonb),
              ARRAY[${item.tamanho}::text],
              to_jsonb(
                COALESCE((estoque_por_tamanho ->> ${item.tamanho}::text)::integer, 0)
                + ${item.quantidade}::integer
              )
            ),
            estoque = estoque + ${item.quantidade}::integer,
            atualizado_em = NOW()
        WHERE id = ${item.produto_id}
      `;
    } catch (erro) {
      console.error("Falha ao restaurar estoque:", item, erro);
    }
  }
}

// Estorno automático (opcional): só acontece com ESTORNO_AUTOMATICO=true.
// Usado quando o cliente pagou mas o estoque acabou antes da confirmação.
async function tentarEstorno(accessToken, pedido, pagamentoId) {
  if (process.env.ESTORNO_AUTOMATICO !== "true") return false;

  try {
    const mp = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(pagamentoId)}/refunds`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Idempotency-Key": `estorno-${pedido.codigo}`,
        },
        body: JSON.stringify({}),
      }
    );
    const dados = await mp.json().catch(() => ({}));

    if (!mp.ok) {
      console.error("Estorno automático falhou:", dados);
      return false;
    }

    await db.sql`
      UPDATE pedidos
      SET pagamento_status = 'estornado',
          estorno_id = ${dados.id ? String(dados.id) : null},
          atualizado_em = NOW()
      WHERE id = ${pedido.id}
    `;
    return true;
  } catch (erro) {
    console.error("Erro no estorno automático:", erro);
    return false;
  }
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

    // Nunca confiamos no corpo da notificação: consultamos o pagamento
    // diretamente no Mercado Pago.
    const mp = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
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

    const status = String(pagamento.status || "pendente");
    const pagamentoStatus = STATUS_MAP[status] || status;
    const pagamentoMetodo = String(
      pagamento.payment_method_id || pagamento.payment_type_id || ""
    ).trim();

    // O estado do pagamento é sempre atualizado (inclusive estorno e
    // chargeback depois de aprovado). Já o estoque só é mexido uma vez.
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
      if (
        !pedido.estoque_processado &&
        ["rejected", "cancelled", "refunded", "charged_back"].includes(status)
      ) {
        await db.sql`
          UPDATE pedidos
          SET status = CASE WHEN status = 'pendente' THEN 'cancelado' ELSE status END,
              atualizado_em = NOW()
          WHERE id = ${pedido.id}
        `;
      }
      return resposta(200, { received: true, payment_status: pagamentoStatus });
    }

    // Só consideramos aprovado quando o valor pago cobre o total do pedido.
    const valorPago = Number(
      pagamento.transaction_amount || pagamento.transaction_details?.total_paid_amount || 0
    );
    const totalPedido = Number(pedido.total || 0);
    if (valorPago + 0.001 < totalPedido) {
      console.error("Pagamento aprovado com valor menor que o pedido:", codigo, valorPago, totalPedido);
      return resposta(409, { error: "Pagamento aprovado com valor inferior ao pedido." });
    }

    if (pedido.estoque_processado) {
      return resposta(200, { received: true, already_processed: true });
    }

    // ------------------------------------------------------------------
    // "Reivindicação" atômica do pedido: se duas notificações chegarem ao
    // mesmo tempo, só uma recebe a linha de volta e baixa o estoque.
    // A outra cai no `already_processed` e não faz nada.
    // ------------------------------------------------------------------
    const reivindicado = await db.sql`
      UPDATE pedidos
      SET estoque_processado = TRUE, atualizado_em = NOW()
      WHERE id = ${pedido.id}
        AND estoque_processado = FALSE
        AND status <> 'estoque_indisponivel'
      RETURNING id
    `;
    if (!reivindicado.length) {
      return resposta(200, { received: true, already_processed: true });
    }

    const itens = await db.sql`
      SELECT id, produto_id, produto_nome, tamanho, quantidade
      FROM itens_pedido WHERE pedido_id = ${pedido.id} ORDER BY id ASC
    `;

    const baixas = [];

    try {
      if (!itens.length) {
        throw new Error(`Pedido ${codigo} aprovado, mas sem itens.`);
      }

      for (const item of itens) {
        // O WHERE garante que nunca fica negativo, mesmo com vendas simultâneas.
        const atualizados = await db.sql`
          UPDATE produtos
          SET estoque_por_tamanho = jsonb_set(
                COALESCE(estoque_por_tamanho, '{}'::jsonb),
                ARRAY[${item.tamanho}::text],
                to_jsonb(
                  COALESCE((estoque_por_tamanho ->> ${item.tamanho}::text)::integer, 0)
                  - ${item.quantidade}::integer
                )
              ),
              estoque = GREATEST(0, estoque - ${item.quantidade}::integer),
              atualizado_em = NOW()
          WHERE id = ${item.produto_id}
            AND COALESCE((estoque_por_tamanho ->> ${item.tamanho}::text)::integer, 0)
                >= ${item.quantidade}::integer
          RETURNING id
        `;

        if (!atualizados.length) {
          throw new EstoqueInsuficienteError(
            `Estoque insuficiente: ${item.produto_nome} (${item.tamanho}).`
          );
        }
        baixas.push(item);
      }

      await db.sql`
        UPDATE pedidos
        SET status = 'confirmado',
            pagamento_status = 'aprovado',
            atualizado_em = NOW()
        WHERE id = ${pedido.id}
      `;
    } catch (erro) {
      await restaurarEstoque(baixas);

      if (erro instanceof EstoqueInsuficienteError) {
        // O cliente pagou, mas o estoque acabou. Marca o pedido para atenção
        // manual (e estorna sozinho, se ESTORNO_AUTOMATICO=true).
        await db.sql`
          UPDATE pedidos
          SET status = 'estoque_indisponivel',
              estoque_processado = FALSE,
              atualizado_em = NOW()
          WHERE id = ${pedido.id}
        `;
        console.error("Pagamento aprovado sem estoque:", codigo, erro.message);
        const estornado = await tentarEstorno(accessToken, pedido, pagamento.id);
        return resposta(200, {
          received: true,
          order_status: "estoque_indisponivel",
          refunded: estornado,
        });
      }

      // Erro inesperado (banco fora do ar, etc.): libera a reivindicação para
      // o Mercado Pago poder reenviar a notificação e tentarmos de novo.
      await db.sql`
        UPDATE pedidos
        SET estoque_processado = FALSE, atualizado_em = NOW()
        WHERE id = ${pedido.id}
      `.catch((e) => console.error("Falha ao liberar pedido:", e));
      throw erro;
    }

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
