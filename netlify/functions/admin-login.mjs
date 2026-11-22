import crypto from "node:crypto";
import { getDatabase } from "@netlify/database";

import { criarToken } from "./_lib/admin-auth.mjs";

const db = getDatabase();

const MAX_TENTATIVAS = 5;
const JANELA_MINUTOS = 15;

function resposta(status, dados) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Compara os hashes (tamanho fixo), assim nem o tamanho da senha vaza.
function senhaConfere(informada, esperada) {
  const a = crypto.createHash("sha256").update(String(informada)).digest();
  const b = crypto.createHash("sha256").update(String(esperada)).digest();
  return crypto.timingSafeEqual(a, b);
}

function ipDe(req, context) {
  return (
    context?.ip ||
    req.headers.get("x-nf-client-connection-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "desconhecido"
  );
}

export default async (req, context) => {
  if (req.method !== "POST") {
    return resposta(405, { error: "Método não permitido." });
  }

  const senhaAdmin = process.env.ADMIN_PASSWORD;

  if (!senhaAdmin) {
    return resposta(500, {
      error:
        "Painel de admin não configurado. Defina ADMIN_PASSWORD (e ADMIN_SECRET) nas variáveis de ambiente da Netlify.",
    });
  }

  const ip = ipDe(req, context);

  // Anti força-bruta. Se a tabela ainda não existir (migration 006 não
  // aplicada), o login continua funcionando e só registramos o aviso.
  let limiteAtivo = true;
  try {
    const rows = await db.sql`
      SELECT COUNT(*)::int AS total
      FROM admin_login_tentativas
      WHERE ip = ${ip} AND criado_em > NOW() - INTERVAL '15 minutes'
    `;
    if ((rows[0]?.total || 0) >= MAX_TENTATIVAS) {
      return resposta(429, {
        error: `Muitas tentativas. Aguarde ${JANELA_MINUTOS} minutos e tente de novo.`,
      });
    }
  } catch (erro) {
    limiteAtivo = false;
    console.error("Limite de tentativas indisponível (rode a migration 006):", erro?.message);
  }

  try {
    const body = await req.json();
    const senha = body?.senha;

    if (!senha || typeof senha !== "string") {
      return resposta(400, { error: "Informe a senha." });
    }

    if (!senhaConfere(senha, senhaAdmin)) {
      if (limiteAtivo) {
        await db.sql`INSERT INTO admin_login_tentativas (ip) VALUES (${ip})`.catch(() => {});
        await db.sql`
          DELETE FROM admin_login_tentativas WHERE criado_em < NOW() - INTERVAL '1 day'
        `.catch(() => {});
      }
      // Pequeno atraso para deixar tentativas em massa mais lentas.
      await new Promise((r) => setTimeout(r, 400));
      return resposta(401, { error: "Senha incorreta." });
    }

    if (limiteAtivo) {
      await db.sql`DELETE FROM admin_login_tentativas WHERE ip = ${ip}`.catch(() => {});
    }

    return resposta(200, { token: criarToken() });
  } catch (erro) {
    console.error("Erro no login do admin:", erro);
    return resposta(500, { error: "Erro interno ao autenticar." });
  }
};

export const config = {
  path: "/api/admin/login",
};
