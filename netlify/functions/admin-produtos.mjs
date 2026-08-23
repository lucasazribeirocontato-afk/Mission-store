import { getDatabase } from "@netlify/database";
import { extrairToken, tokenValido, respostaNaoAutorizado } from "./_lib/admin-auth.mjs";

const db = getDatabase();

function resposta(status, dados) {
  return new Response(JSON.stringify(dados), { status, headers: { "Content-Type": "application/json" } });
}
function normalizarTamanhos(tamanhos) {
  if (!Array.isArray(tamanhos)) return [];
  return [...new Set(tamanhos.map((t) => String(t).trim()).filter(Boolean))].slice(0, 30);
}
function normalizarEstoquePorTamanho(tamanhos, valor, estoqueFallback = 0) {
  const lista = normalizarTamanhos(tamanhos);
  const entrada = valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {};
  const mapa = {};
  for (const tamanho of lista) {
    const n = Number(entrada[tamanho]);
    mapa[tamanho] = Number.isInteger(n) && n >= 0 ? n : 0;
  }
  if (lista.length === 1 && !Object.prototype.hasOwnProperty.call(entrada, lista[0])) {
    mapa[lista[0]] = Math.max(0, Number(estoqueFallback) || 0);
  }
  return mapa;
}
function validar(preco) {
  const n = Number(preco);
  if (!Number.isFinite(n) || n < 0) return { erro: "Preço inválido." };
  return { precoNum: n };
}
function estoqueTotal(mapa) {
  return Object.values(mapa).reduce((sum, v) => sum + Number(v || 0), 0);
}

export default async (req) => {
  if (!tokenValido(extrairToken(req))) return respostaNaoAutorizado();

  try {
    if (req.method === "GET") {
      const rows = await db.sql`
        SELECT id, nome, categoria, preco, cor, tamanhos, estoque, estoque_por_tamanho,
               novo, destaque, imagem, ativo, criado_em, atualizado_em
        FROM produtos ORDER BY id ASC
      `;
      return resposta(200, { produtos: rows });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { nome, categoria, preco, cor, tamanhos = [], estoque_por_tamanho = {}, estoque = 0,
              novo = false, destaque = false, imagem = null } = body;
      if (!nome || !categoria || preco === undefined || !cor) {
        return resposta(400, { error: "Nome, categoria, preço e cor são obrigatórios." });
      }
      const validacao = validar(preco);
      if (validacao.erro) return resposta(400, { error: validacao.erro });
      const lista = normalizarTamanhos(tamanhos);
      if (!lista.length) return resposta(400, { error: "Informe pelo menos um tamanho. Use Único para produtos sem tamanho." });
      const mapa = normalizarEstoquePorTamanho(lista, estoque_por_tamanho, estoque);
      const total = estoqueTotal(mapa);

      const rows = await db.sql`
        INSERT INTO produtos (nome, categoria, preco, cor, tamanhos, estoque, estoque_por_tamanho, novo, destaque, imagem)
        VALUES (${nome.trim()}, ${categoria}, ${validacao.precoNum}, ${cor.trim()},
                ${JSON.stringify(lista)}, ${total}, ${JSON.stringify(mapa)}, ${!!novo}, ${!!destaque}, ${imagem || null})
        RETURNING *
      `;
      return resposta(201, { produto: rows[0] });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const { id, nome, categoria, preco, cor, tamanhos = [], estoque_por_tamanho = {}, estoque = 0,
              novo = false, destaque = false, imagem = null, ativo = true } = body;
      const idNum = Number(id);
      if (!Number.isInteger(idNum)) return resposta(400, { error: "ID do produto inválido." });
      if (!nome || !categoria || preco === undefined || !cor) {
        return resposta(400, { error: "Nome, categoria, preço e cor são obrigatórios." });
      }
      const validacao = validar(preco);
      if (validacao.erro) return resposta(400, { error: validacao.erro });
      const lista = normalizarTamanhos(tamanhos);
      if (!lista.length) return resposta(400, { error: "Informe pelo menos um tamanho." });
      const mapa = normalizarEstoquePorTamanho(lista, estoque_por_tamanho, estoque);
      const total = estoqueTotal(mapa);

      const rows = await db.sql`
        UPDATE produtos
        SET nome=${nome.trim()}, categoria=${categoria}, preco=${validacao.precoNum}, cor=${cor.trim()},
            tamanhos=${JSON.stringify(lista)}, estoque=${total}, estoque_por_tamanho=${JSON.stringify(mapa)},
            novo=${!!novo}, destaque=${!!destaque}, imagem=${imagem || null}, ativo=${ativo !== false},
            atualizado_em=NOW()
        WHERE id=${idNum}
        RETURNING *
      `;
      if (!rows.length) return resposta(404, { error: "Produto não encontrado." });
      return resposta(200, { produto: rows[0] });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const idNum = Number(url.searchParams.get("id"));
      if (!Number.isInteger(idNum)) return resposta(400, { error: "ID inválido." });
      const rows = await db.sql`
        UPDATE produtos SET ativo=FALSE, atualizado_em=NOW()
        WHERE id=${idNum} RETURNING id, ativo
      `;
      if (!rows.length) return resposta(404, { error: "Produto não encontrado." });
      return resposta(200, { produto: rows[0] });
    }

    return resposta(405, { error: "Método não permitido." });
  } catch (error) {
    console.error("Erro no admin de produtos:", error);
    return resposta(500, { error: "Não foi possível salvar o produto." });
  }
};
