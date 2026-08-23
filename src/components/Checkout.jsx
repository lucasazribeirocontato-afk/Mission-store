import { useState } from "react";
import { ArrowLeft, Check, LoaderCircle, X } from "lucide-react";
import PagamentoBrick from "./PagamentoBrick";

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Checkout({ aberto, fechar, carrinho, totalCarrinho, onPedidoCriado }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [pedido, setPedido] = useState(null);
  const [resultadoPagamento, setResultadoPagamento] = useState(null);

  if (!aberto) return null;

  function resetar() {
    setNome("");
    setTelefone("");
    setEmail("");
    setObservacoes("");
    setErro("");
    setPedido(null);
    setResultadoPagamento(null);
    setEnviando(false);
  }

  function fecharCheckout() {
    resetar();
    fechar();
  }

  function aoResultadoPagamento(resultado) {
    setErro("");
    setResultadoPagamento(resultado);
  }

  function aoErroPagamento(mensagem) {
    setErro(mensagem);
  }

  async function enviarPedido(event) {
    event.preventDefault();
    setErro("");

    if (!nome.trim() || !telefone.trim()) {
      setErro("Preencha seu nome e WhatsApp.");
      return;
    }
    if (!carrinho.length) {
      setErro("Seu carrinho está vazio.");
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          nome_cliente: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          observacoes: observacoes.trim(),
          itens: carrinho.map((item) => ({
            produto_id: Number(item.id),
            tamanho: item.tamanho,
            quantidade: Number(item.quantidade),
          })),
        }),
      });

      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.error || "Não foi possível criar seu pedido.");

      setPedido(dados.pedido);
      onPedidoCriado?.(dados.pedido);
      // O pedido é criado como pendente. O Payment Brick é exibido a seguir
      // e a baixa de estoque só acontece depois que o webhook confirmar
      // o pagamento aprovado — nunca antes disso.
    } catch (error) {
      setErro(error.message || "Não foi possível finalizar o pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="checkout-overlay" role="presentation">
      <section className="checkout" role="dialog" aria-modal="true" aria-label="Finalizar pedido">
        <header className="checkout-header">
          <div>
            <p className="eyebrow">Mission Store · Checkout</p>
            <h2>{pedido ? "Pedido criado." : "Finalizar pedido"}</h2>
          </div>
          <button type="button" onClick={fecharCheckout} className="checkout-fechar"
            aria-label="Fechar checkout" disabled={enviando}>
            <X size={22} />
          </button>
        </header>

        {pedido ? (
          <div className="checkout-sucesso">
            <div className="checkout-sucesso-icone"><Check size={30} /></div>
            <p className="checkout-sucesso-label">Pedido registrado</p>
            <h3>{pedido.codigo}</h3>

            <div className="checkout-resumo checkout-resumo-sucesso">
              <div><span>Total</span><strong>{formatarPreco(pedido.total)}</strong></div>
            </div>

            {resultadoPagamento?.status === "approved" ? (
              <p>
                Pagamento aprovado! Seu pedido foi confirmado e o estoque já
                foi reservado para você.
              </p>
            ) : resultadoPagamento?.status === "in_process" ||
              resultadoPagamento?.status === "pending" ? (
              <p>
                Pagamento em análise (comum no PIX até a confirmação e em
                alguns cartões). Assim que o Mercado Pago confirmar, seu
                pedido é atualizado automaticamente. O estoque só é baixado
                depois dessa confirmação.
              </p>
            ) : (
              <>
                <p>
                  Seu pedido foi criado e aguarda o pagamento. O estoque só
                  será baixado quando o pagamento for aprovado.
                </p>
                <PagamentoBrick
                  pedido={pedido}
                  onResultado={aoResultadoPagamento}
                  onErro={aoErroPagamento}
                />
              </>
            )}

            {erro && <div className="checkout-erro" role="alert">{erro}</div>}

            <button type="button" className="botao botao-contorno" onClick={fecharCheckout}>
              Continuar navegando
            </button>
          </div>
        ) : (
          <form onSubmit={enviarPedido} className="checkout-form">
            <div className="checkout-grid">
              <label>
                <span>Nome *</span>
                <input value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome" autoComplete="name" required />
              </label>
              <label>
                <span>WhatsApp *</span>
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(51) 99999-9999" autoComplete="tel" required />
              </label>
              <label className="checkout-full">
                <span>E-mail</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com" type="email" autoComplete="email" />
              </label>
              <label className="checkout-full">
                <span>Observações</span>
                <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Alguma observação sobre seu pedido?" rows={3} />
              </label>
            </div>

            <div className="checkout-pedido">
              <div className="checkout-pedido-titulo"><span>Seu pedido</span><span>{carrinho.length} item(ns)</span></div>
              {carrinho.map((item) => (
                <div key={`${item.id}-${item.tamanho}`} className="checkout-item">
                  <div><strong>{item.nome}</strong><span>{item.quantidade}× · Tamanho {item.tamanho}</span></div>
                  <strong>{formatarPreco(item.preco * item.quantidade)}</strong>
                </div>
              ))}
              <div className="checkout-total"><span>Total</span><strong>{formatarPreco(totalCarrinho)}</strong></div>
            </div>

            {erro && <div className="checkout-erro" role="alert">{erro}</div>}

            <div className="checkout-acoes">
              <button type="button" className="botao botao-contorno" onClick={fecharCheckout} disabled={enviando}>
                <ArrowLeft size={16} /> Voltar
              </button>
              <button type="submit" className="botao botao-solido checkout-enviar" disabled={enviando}>
                {enviando ? <><LoaderCircle size={17} className="checkout-spinner" /> Criando pedido...</> : "Continuar para pagamento"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default Checkout;
