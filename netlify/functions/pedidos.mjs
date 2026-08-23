import crypto from "node:crypto";
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
  if (req.method !== "POST") return resposta(405, { error: "Método não permitido." });

  try {
    const body = await req.json();
    const nome_cliente = texto(body.nome_cliente, 100);
    const email = texto(body.email, 150);
    const telefone = texto(body.telefone, 30);
    const observacoes = texto(body.observacoes, 1000);
    const itens = body.itens;

    if (!nome_cliente || !telefone) return resposta(400, { error: "Nome e telefone são obrigatórios." });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return resposta(400, { error: "E-mail inválido." });
    if (!Array.isArray(itens) || !itens.length || itens.length > 100) return resposta(400, { error: "Pedido inválido." });

    const consolidados = new Map();
    for (const item of itens) {
      const produtoId = Number(item.produto_id);
      const tamanho = texto(item.tamanho || "Único", 30) || "Único";
      const quantidade = Number(item.quantidade);
      if (!Number.isInteger(produtoId) || !Number.isInteger(quantidade) || quantidade <= 0 || quantidade > 99) {
        return resposta(400, { error: "Item do pedido inválido." });
      }
      const chave = `${produtoId}::${tamanho}`;
      const anterior = consolidados.get(chave);
      const total = (anterior?.quantidade || 0) + quantidade;
      if (total > 99) return resposta(400, { error: "Quantidade máxima excedida para um item." });
      consolidados.set(chave, { produtoId, tamanho, quantidade: total });
    }

    const itensProcessados = [];
    let subtotal = 0;

    // IMPORTANTE: neste ponto NÃO baixamos estoque.
    // O estoque só será baixado pelo webhook após pagamento aprovado.
    for (const item of consolidados.values()) {
      const rows = await db.sql`
        SELECT id, nome, preco, estoque, tamanhos, estoque_por_tamanho, ativo
        FROM produtos WHERE id = ${item.produtoId} LIMIT 1
      `;
      const produto = rows[0];
      if (!produto) return resposta(400, { error: `Produto ${item.produtoId} não encontrado.` });
      if (produto.ativo === false) return resposta(400, { error: `${produto.nome} está indisponível.` });

      const tamanhos = Array.isArray(produto.tamanhos) ? produto.tamanhos : [];
      if (tamanhos.length && !tamanhos.includes(item.tamanho)) {
        return resposta(400, { error: `${produto.nome}: tamanho ${item.tamanho} inválido.` });
      }

      const mapa = produto.estoque_por_tamanho && typeof produto.estoque_por_tamanho === "object"
        ? produto.estoque_por_tamanho
        : { [tamanhos[0] || "Único"]: Number(produto.estoque) || 0 };

      const disponivel = Number(mapa[item.tamanho] || 0);
      if (disponivel < item.quantidade) {
        return resposta(409, { error: `${produto.nome}: só há ${disponivel} unidade(s) no tamanho ${item.tamanho}.` });
      }

      const preco = Number(produto.preco);
      subtotal += preco * item.quantidade;
      itensProcessados.push({ ...item, nome: produto.nome, preco });
    }

    const valorFrete = 0;
    const total = subtotal + valorFrete;
    const codigo = `MS-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    const pedidos = await db.sql`
      INSERT INTO pedidos (
        codigo, nome_cliente, email, telefone, subtotal, frete, total,
        pagamento, status, observacoes
      )
      VALUES (
        ${codigo}, ${nome_cliente}, ${email || null}, ${telefone},
        ${subtotal}, ${valorFrete}, ${total},
        'pendente', 'pendente', ${observacoes || null}
      )
      RETURNING id, codigo, subtotal, frete, total, pagamento, status, criado_em
    `;
    const pedido = pedidos[0];

    for (const item of itensProcessados) {
      await db.sql`
        INSERT INTO itens_pedido (
          pedido_id, produto_id, produto_nome, tamanho, quantidade, preco
        )
        VALUES (
          ${pedido.id}, ${item.produtoId}, ${item.nome},
          ${item.tamanho}, ${item.quantidade}, ${item.preco}
        )
      `;
    }

    return resposta(201, { pedido });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return resposta(500, { error: "Não foi possível criar o pedido." });
  }
};

export const config = { path: "/api/pedidos" };
