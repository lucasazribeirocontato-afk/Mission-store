import { useEffect, useState } from "react";
import { Payment } from "@mercadopago/sdk-react";
import { garantirMercadoPagoIniciado } from "../utils/mercadoPago";

/**
 * Renderiza o Payment Brick (PIX + cartão) para um pedido já criado e
 * pendente. O valor exibido é só informativo: quem manda de verdade é o
 * backend, que recalcula o total a partir do banco antes de processar
 * qualquer pagamento (ver netlify/functions/process-payment.mjs).
 */
function PagamentoBrick({ pedido, onResultado, onErro }) {
  const [pronto, setPronto] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    garantirMercadoPagoIniciado();
  }, []);

  if (!pedido) return null;

  const initialization = {
    amount: Number(pedido.total),
  };

  const customization = {
    paymentMethods: {
      creditCard: "all",
      debitCard: "all",
      bankTransfer: "all", // PIX aparece aqui no Brasil
      ticket: "none",
      mercadoPago: "none", // sem preferenceId, não oferecemos a Wallet
    },
  };

  async function aoEnviar({ formData }) {
    setProcessando(true);
    try {
      const resposta = await fetch("/api/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          pedido_id: pedido.id,
          token_pedido: pedido.token,
          formData,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados.error || "Não foi possível processar o pagamento.");
      }

      onResultado?.(dados);
    } catch (error) {
      onErro?.(error.message || "Não foi possível processar o pagamento.");
      // Rejeitar aqui faz o Brick voltar ao estado normal do formulário
      // em vez de travar em "carregando" para sempre.
      throw error;
    } finally {
      setProcessando(false);
    }
  }

  function aoErrar(error) {
    console.error("Erro no Payment Brick:", error);
    onErro?.("Houve um problema ao carregar o pagamento. Tente novamente.");
  }

  return (
    <div className="pagamento-brick">
      {!pronto && <p className="admin-vazio">Carregando formas de pagamento...</p>}
      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={aoEnviar}
        onReady={() => setPronto(true)}
        onError={aoErrar}
      />
      {processando && <p className="admin-vazio">Processando pagamento...</p>}
    </div>
  );
}

export default PagamentoBrick;
