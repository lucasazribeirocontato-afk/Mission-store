import { initMercadoPago } from "@mercadopago/sdk-react";

let iniciado = false;

/**
 * Inicializa o SDK do Mercado Pago usando a Public Key (segura no frontend).
 * A Access Token NUNCA deve aparecer aqui — ela só existe nas Netlify Functions.
 * Chamar várias vezes não tem efeito colateral: só inicializa de fato uma vez.
 */
export function garantirMercadoPagoIniciado() {
  if (iniciado) return true;

  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  if (!publicKey) {
    console.error(
      "VITE_MERCADOPAGO_PUBLIC_KEY não configurada. Defina essa variável na Netlify e no seu .env local."
    );
    return false;
  }

  initMercadoPago(publicKey, { locale: "pt-BR" });
  iniciado = true;
  return true;
}
