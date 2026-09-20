import { useState } from "react";
import { Search, PackageCheck, LoaderCircle } from "lucide-react";

const STATUS = {
  pendente: { label: "Pedido recebido", step: 1 },
  confirmado: { label: "Pagamento confirmado", step: 2 },
  em_preparacao: { label: "Em preparação", step: 3 },
  enviado: { label: "Enviado", step: 4 },
  entregue: { label: "Entregue", step: 5 },
  cancelado: { label: "Cancelado", step: 0 },
  estoque_indisponivel: { label: "Estoque requer atenção", step: 0 },
};

function RastrearPedido() {
  const [codigo, setCodigo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function consultar(event) {
    event.preventDefault();
    setErro("");
    setResultado(null);

    if (!codigo.trim() || !telefone.trim()) {
      setErro("Informe o código do pedido e o WhatsApp usado na compra.");
      return;
    }

    setCarregando(true);
    try {
      const params = new URLSearchParams({
        codigo: codigo.trim().toUpperCase(),
        telefone: telefone.trim(),
      });
      const resposta = await fetch(`/api/pedido-status?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.error || "Não foi possível consultar o pedido.");
      setResultado(dados.pedido);
    } catch (error) {
      setErro(error.message || "Não foi possível consultar o pedido.");
    } finally {
      setCarregando(false);
    }
  }

  const status = resultado ? STATUS[resultado.status] || STATUS.pendente : null;

  return (
    <section className="tracking section" id="rastrear">
      <div className="container tracking-grid">
        <div>
          <p className="eyebrow">Seu pedido</p>
          <h2 className="section-titulo">Acompanhe sua missão.</h2>
          <p className="tracking-intro">
            Digite o código recebido após a compra e o WhatsApp usado no pedido.
          </p>
          <div className="tracking-code-example">Ex.: MS-ABC123-12ABCD</div>
        </div>

        <div className="tracking-card">
          <form onSubmit={consultar}>
            <label>
              <span>Código do pedido</span>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="MS-..." />
            </label>
            <label>
              <span>WhatsApp da compra</span>
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(51) 99999-9999" />
            </label>
            <button className="botao botao-solido" disabled={carregando}>
              {carregando ? <><LoaderCircle size={17} className="checkout-spinner"/> Consultando...</> : <><Search size={17}/> Consultar pedido</>}
            </button>
          </form>

          {erro && <div className="tracking-erro" role="alert">{erro}</div>}

          {resultado && status && (
            <div className="tracking-result">
              <div className="tracking-result-top">
                <div><small>Pedido</small><strong>{resultado.codigo}</strong></div>
                <PackageCheck size={28}/>
              </div>
              <p className="tracking-status-label">{status.label}</p>
              {status.step > 0 && (
                <div className="tracking-steps" aria-label={`Etapa ${status.step} de 5`}>
                  {["Recebido", "Confirmado", "Preparação", "Enviado", "Entregue"].map((label, index) => (
                    <div className={index + 1 <= status.step ? "ativo" : ""} key={label}>
                      <span>{index + 1}</span><small>{label}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default RastrearPedido;
