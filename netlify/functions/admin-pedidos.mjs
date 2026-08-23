import { getDatabase } from "@netlify/database";

import {
  extrairToken,
  tokenValido,
  respostaNaoAutorizado,
} from "./_lib/admin-auth.mjs";

const db = getDatabase();

const STATUS_VALIDOS = [
  "pendente",
  "confirmado",
  "em_preparacao",
  "enviado",
  "entregue",
  "cancelado",
  "estoque_indisponivel",
];

function resposta(status, dados) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  const token = extrairToken(req);

  if (!tokenValido(token)) {
    return respostaNaoAutorizado();
  }

  try {
    // ------------------------------------------------------------
    // LISTAR ou DETALHAR (com ?id= retorna também os itens do pedido)
    // ------------------------------------------------------------
    if (req.method === "GET") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (id) {
        const idNum = Number(id);
        if (!Number.isInteger(idNum)) {
          return resposta(400, { error: "ID do pedido inválido." });
        }

        const pedidos = await db.sql`
          SELECT * FROM pedidos WHERE id = ${idNum}
        `;
        const pedido = pedidos[0];

        if (!pedido) {
          return resposta(404, { error: "Pedido não encontrado." });
        }

        const itens = await db.sql`
          SELECT * FROM itens_pedido
          WHERE pedido_id = ${idNum}
          ORDER BY id ASC
        `;

        return resposta(200, { pedido, itens });
      }

      const pedidos = await db.sql`
        SELECT id, codigo, nome_cliente, telefone, email, subtotal,
               frete, total, pagamento, pagamento_status, pagamento_metodo,
               pagamento_id, pagamento_preferencia_id, pagamento_atualizado_em,
               estoque_processado, status, criado_em
        FROM pedidos
        ORDER BY criado_em DESC, id DESC
        LIMIT 200
      `;

      return resposta(200, { pedidos });
    }

    // ------------------------------------------------------------
    // ATUALIZAR STATUS
    // ------------------------------------------------------------
    if (req.method === "PATCH") {
      const body = await req.json();
      const { id, status } = body;

      const idNum = Number(id);
      if (!Number.isInteger(idNum)) {
        return resposta(400, { error: "ID do pedido inválido." });
      }

      if (!STATUS_VALIDOS.includes(status)) {
        return resposta(400, { error: "Status inválido." });
      }

      const rows = await db.sql`
        UPDATE pedidos
        SET status = ${status}, atualizado_em = NOW()
        WHERE id = ${idNum}
        RETURNING *
      `;

      if (!rows[0]) {
        return resposta(404, { error: "Pedido não encontrado." });
      }

      return resposta(200, { pedido: rows[0] });
    }

    return resposta(405, { error: "Método não permitido." });
  } catch (erro) {
    console.error("Erro no admin de pedidos:", erro);
    return resposta(500, {
      error: erro?.message || "Erro interno ao gerenciar pedidos.",
    });
  }
};

export const config = {
  path: "/api/admin/pedidos",
};
