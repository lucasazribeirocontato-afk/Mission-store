import { getDatabase } from "@netlify/database";

const db = getDatabase();

function resposta(status, dados) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function texto(valor, max) {
  return String(valor ?? "").trim().slice(0, max);
}

export default async (req) => {
  if (req.method !== "GET") return resposta(405, { error: "Método não permitido." });

  try {
    const url = new URL(req.url);
    const codigo = texto(url.searchParams.get("codigo"), 80).toUpperCase();
    const telefone = texto(url.searchParams.get("telefone"), 30);

    if (!codigo || !telefone) {
      return resposta(400, { error: "Informe o código do pedido e o WhatsApp." });
    }

    const pedidos = await db.sql`
      SELECT codigo, status, criado_em
      FROM pedidos
      WHERE codigo = ${codigo}
        AND regexp_replace(telefone, '[^0-9]', '', 'g') =
            regexp_replace(${telefone}, '[^0-9]', '', 'g')
      LIMIT 1
    `;

    if (!pedidos[0]) {
      return resposta(404, { error: "Pedido não encontrado. Confira o código e o WhatsApp usado na compra." });
    }

    return resposta(200, { pedido: pedidos[0] });
  } catch (error) {
    console.error("Erro ao consultar pedido:", error);
    return resposta(500, { error: "Não foi possível consultar o pedido agora." });
  }
};

export const config = { path: "/api/pedido-status" };
