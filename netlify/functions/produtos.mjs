import { getDatabase } from "@netlify/database";

const db = getDatabase();

function headers() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=30, s-maxage=60",
  };
}

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers: headers() });
  }
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const categoria = url.searchParams.get("categoria");
    let rows;
    const campos = `id, nome, categoria, preco, cor, tamanhos, estoque, estoque_por_tamanho,
                    novo, destaque, imagem`;
    if (id) {
      rows = await db.sql`SELECT id, nome, categoria, preco, cor, tamanhos, estoque, estoque_por_tamanho, novo, destaque, imagem FROM produtos WHERE id = ${Number(id)} AND ativo = TRUE LIMIT 1`;
    } else if (categoria && categoria !== "Tudo") {
      rows = await db.sql`SELECT id, nome, categoria, preco, cor, tamanhos, estoque, estoque_por_tamanho, novo, destaque, imagem
                           FROM produtos WHERE ativo = TRUE AND categoria = ${categoria}
                           ORDER BY destaque DESC, id ASC`;
    } else {
      rows = await db.sql`SELECT id, nome, categoria, preco, cor, tamanhos, estoque, estoque_por_tamanho, novo, destaque, imagem
                           FROM produtos WHERE ativo = TRUE ORDER BY destaque DESC, id ASC`;
    }
    return new Response(JSON.stringify({ produtos: rows }), { status: 200, headers: headers() });
  } catch (error) {
    console.error("Erro ao consultar produtos:", error);
    return new Response(JSON.stringify({ error: "Não foi possível consultar os produtos." }), { status: 500, headers: headers() });
  }
}
export const config = { path: "/api/produtos" };
