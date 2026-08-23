import crypto from "node:crypto";

// Segredo usado para assinar o token de sessão do admin.
// Configure ADMIN_SECRET na Netlify (Site settings > Environment variables).
// Se não existir, cai para ADMIN_PASSWORD só para não quebrar em dev local.
const SEGREDO =
  process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";

const VALIDADE_HORAS = 12;

function base64url(entrada) {
  const buffer = Buffer.isBuffer(entrada)
    ? entrada
    : Buffer.from(entrada);

  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlParaBuffer(valor) {
  const normalizado = valor
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  return Buffer.from(normalizado, "base64");
}

function assinar(payloadBase64) {
  return base64url(
    crypto
      .createHmac("sha256", SEGREDO)
      .update(payloadBase64)
      .digest()
  );
}

function assinaturaValida(payloadBase64, assinatura) {
  if (!assinatura) return false;

  const esperada = assinar(payloadBase64);
  const bufA = Buffer.from(assinatura);
  const bufB = Buffer.from(esperada);

  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
}

// Cria um token de sessão simples: payload + assinatura, sem precisar
// guardar nada no banco. Expira sozinho depois de VALIDADE_HORAS.
export function criarToken() {
  const payload = {
    admin: true,
    exp: Date.now() + VALIDADE_HORAS * 60 * 60 * 1000,
  };

  const payloadBase64 = base64url(JSON.stringify(payload));
  const assinatura = assinar(payloadBase64);

  return `${payloadBase64}.${assinatura}`;
}

export function tokenValido(token) {
  if (!SEGREDO) return false;
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }

  const [payloadBase64, assinatura] = token.split(".");

  if (!assinaturaValida(payloadBase64, assinatura)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      base64urlParaBuffer(payloadBase64).toString("utf-8")
    );

    return payload?.admin === true && payload?.exp > Date.now();
  } catch {
    return false;
  }
}

export function extrairToken(req) {
  const cabecalho = req.headers.get("authorization") || "";
  const [tipo, valor] = cabecalho.split(" ");

  return tipo === "Bearer" && valor ? valor : null;
}

export function respostaNaoAutorizado() {
  return new Response(
    JSON.stringify({ error: "Não autorizado. Faça login novamente." }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}
