import crypto from "node:crypto";

import { criarToken } from "./_lib/admin-auth.mjs";

function resposta(status, dados) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
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

  try {
    const body = await req.json();
    const senha = body?.senha;

    if (!senha || typeof senha !== "string") {
      return resposta(400, { error: "Informe a senha." });
    }

    const bufA = Buffer.from(senha);
    const bufB = Buffer.from(senhaAdmin);

    const correta =
      bufA.length === bufB.length &&
      crypto.timingSafeEqual(bufA, bufB);

    if (!correta) {
      return resposta(401, { error: "Senha incorreta." });
    }

    const token = criarToken();

    return resposta(200, { token });
  } catch (erro) {
    console.error("Erro no login do admin:", erro);
    return resposta(500, { error: "Erro interno ao autenticar." });
  }
};

export const config = {
  path: "/api/admin/login",
};
