import crypto from "node:crypto";
import { getDatabase } from "@netlify/database";

const db = getDatabase();

function resposta(status, dados) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hash(valor) {
  return crypto.createHash("sha256").update(String(valor)).digest();
}

function tokenConfere(recebido, esperado) {
  if (!recebido || !esperado) return false;
  return crypto.timingSafeEqual(hash(recebido), hash(esperado));
}

export default async (req) => {
  if (req.method !== "POST") return resposta(405, { error: "Método não permitido." });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");

  if (!accessToken) {
    return resposta(503, { error: "Pagamento não configurado. Defina MERCADOPAGO_ACCESS_TOKEN na Netlify." });
  }

  try {
    const body = await req.json();
    const pedidoId = Number(body.pedido_id);
    const tokenPedido = typeof body.token_pedido === "string" ? body.token_pedido : "";
    const formData = body.formData;

    if (!Number.isInteger(pedidoId)) return resposta(400, { error: "Pedido inválido." });
    if (!formData || typeof formData !== "object") {
      return resposta(400, { error: "Dados de pagamento ausentes." });
    }

    // ------------------------------------------------------------------
    // O frontend nunca é a fonte de verdade do valor. Buscamos o pedido
    // (já criado e validado em /api/pedidos, com preços conferidos no
    // banco) e usamos o total dali — nunca o que vier do Brick.
    // ------------------------------------------------------------------
    const rows = await db.sql`
      SELECT id, codigo, nome_cliente, email, telefone, total, status,
             pagamento_status, token_pagamento
      FROM pedidos WHERE id = ${pedidoId} LIMIT 1
    `;
    const pedido = rows[0];

    // Mesma resposta para "não existe" e "token errado", para não permitir
    // descobrir quais IDs de pedido existem.
    if (!pedido || !tokenConfere(tokenPedido, pedido.token_pagamento)) {
      return resposta(404, { error: "Pedido não encontrado." });
    }

    if (pedido.status === "estoque_indisponivel") {
      return resposta(409, { error: "Este pedido não pode mais ser pago. Entre em contato com a loja." });
    }

    if (pedido.pagamento_status === "aprovado") {
      return resposta(409, { error: "Este pedido já foi pago." });
    }

    const totalPedido = Number(pedido.total);
    if (!Number.isFinite(totalPedido) || totalPedido <= 0) {
      return resposta(400, { error: "Pedido com valor inválido." });
    }

    const paymentBody = {
      transaction_amount: totalPedido,
      token: formData.token,
      description: `Mission Store - Pedido ${pedido.codigo}`,
      installments: Number(formData.installments) || 1,
      payment_method_id: formData.payment_method_id,
      issuer_id: formData.issuer_id,
      payer: {
        email: formData.payer?.email || pedido.email || undefined,
        identification: formData.payer?.identification || undefined,
      },
      external_reference: String(pedido.codigo),
      notification_url: `${siteUrl}/api/pagamento-webhook`,
    };

    const mp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Evita cobrar duas vezes se o navegador reenviar a requisição.
        "X-Idempotency-Key": `${pedido.codigo}-${formData.token || formData.payment_method_id}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const pagamento = await mp.json().catch(() => ({}));

    if (!mp.ok || !pagamento.id) {
      console.error("Mercado Pago (process-payment):", pagamento);
      return resposta(502, { error: pagamento.message || "Não foi possível processar o pagamento." });
    }

    const statusMap = {
      approved: "aprovado",
      pending: "pendente",
      in_process: "em_processamento",
      rejected: "rejeitado",
      cancelled: "cancelado",
    };
    const pagamentoStatus = statusMap[pagamento.status] || pagamento.status;

    // Só registramos o status retornado aqui. A confirmação que baixa
    // estoque é sempre feita pelo webhook, nunca por esta resposta direta —
    // mesmo que o Mercado Pago já diga "approved" neste retorno síncrono.
    await db.sql`
      UPDATE pedidos
      SET pagamento_id = ${String(pagamento.id)},
          pagamento_status = ${pagamentoStatus},
          pagamento_metodo = ${pagamento.payment_method_id || null},
          pagamento_atualizado_em = NOW(),
          atualizado_em = NOW()
      WHERE id = ${pedido.id}
    `;

    return resposta(200, {
      pedido_id: pedido.id,
      codigo: pedido.codigo,
      payment_id: pagamento.id,
      status: pagamento.status,
      status_detail: pagamento.status_detail,
    });
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return resposta(500, { error: "Não foi possível processar o pagamento." });
  }
};

export const config = { path: "/api/process-payment" };
