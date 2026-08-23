import { getDatabase } from "@netlify/database";

const db = getDatabase();

function resposta(status, dados) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function texto(v, max) {
  return String(v ?? "").trim().slice(0, max);
}

export default async (req) => {
  if (req.method !== "POST") return resposta(405, { error: "Método não permitido." });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");

  if (!accessToken) {
    return resposta(503, {
      error: "Pagamento não configurado. Defina MERCADOPAGO_ACCESS_TOKEN na Netlify.",
    });
  }

  try {
    const body = await req.json();
    const pedidoId = Number(body.pedido_id);
    if (!Number.isInteger(pedidoId)) return resposta(400, { error: "Pedido inválido." });

    const rows = await db.sql`
      SELECT id, codigo, nome_cliente, email, telefone, total, pagamento_status, pagamento_preferencia_id
      FROM pedidos WHERE id = ${pedidoId} LIMIT 1
    `;
    const pedido = rows[0];

    if (!pedido) return resposta(404, { error: "Pedido não encontrado." });
    if (pedido.pagamento_status === "aprovado") {
      return resposta(409, { error: "Este pedido já foi pago." });
    }

    const itens = await db.sql`
      SELECT produto_id, produto_nome, tamanho, quantidade, preco
      FROM itens_pedido WHERE pedido_id = ${pedidoId} ORDER BY id ASC
    `;
    if (!itens.length) return resposta(400, { error: "Pedido sem itens." });

    const preferenceBody = {
      items: itens.map((item) => ({
        id: String(item.produto_id),
        title: `${texto(item.produto_nome, 120)} - ${texto(item.tamanho, 30)}`,
        quantity: Number(item.quantidade),
        currency_id: "BRL",
        unit_price: Number(item.preco),
      })),
      payer: {
        name: texto(pedido.nome_cliente, 100),
        email: pedido.email || undefined,
        phone: pedido.telefone ? { number: texto(pedido.telefone, 30) } : undefined,
      },
      external_reference: String(pedido.codigo),
      notification_url: `${siteUrl}/api/pagamento-webhook`,
      back_urls: {
        success: `${siteUrl}/?pagamento=sucesso&pedido=${encodeURIComponent(pedido.codigo)}`,
        pending: `${siteUrl}/?pagamento=pendente&pedido=${encodeURIComponent(pedido.codigo)}`,
        failure: `${siteUrl}/?pagamento=falhou&pedido=${encodeURIComponent(pedido.codigo)}`,
      },
      auto_return: "approved",
    };

    const mp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    const respostaMp = await mp.json().catch(() => ({}));
    if (!mp.ok || !respostaMp.id) {
      console.error("Mercado Pago:", respostaMp);
      return resposta(502, { error: "Não foi possível iniciar o pagamento." });
    }

    await db.sql`
      UPDATE pedidos
      SET pagamento_preferencia_id = ${String(respostaMp.id)},
          pagamento_status = 'pendente',
          pagamento_atualizado_em = NOW(),
          atualizado_em = NOW()
      WHERE id = ${pedidoId}
    `;

    return resposta(200, {
      pedido_id: pedidoId,
      codigo: pedido.codigo,
      preference_id: respostaMp.id,
      checkout_url: respostaMp.init_point || respostaMp.sandbox_init_point,
      sandbox_checkout_url: respostaMp.sandbox_init_point || null,
    });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return resposta(500, { error: "Não foi possível iniciar o pagamento." });
  }
};

export const config = { path: "/api/pagamento" };
