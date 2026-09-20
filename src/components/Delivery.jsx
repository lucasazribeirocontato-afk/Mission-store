import { Truck, MapPinned, ShieldCheck } from "lucide-react";

function Delivery() {
  return (
    <section className="delivery section" id="entrega">
      <div className="container">
        <div className="delivery-head">
          <div>
            <p className="eyebrow">Envio Mission</p>
            <h2 className="section-titulo">A missão chega até você.</h2>
          </div>
          <p>Enviamos pedidos para todos os municípios do Rio Grande do Sul e de Santa Catarina.</p>
        </div>

        <div className="delivery-grid">
          <article><Truck size={24}/><strong>RS + SC</strong><span>Entregas para todo o Rio Grande do Sul e Santa Catarina.</span></article>
          <article><MapPinned size={24}/><strong>Pedido acompanhado</strong><span>Use seu código Mission para consultar o status do pedido.</span></article>
          <article><ShieldCheck size={24}/><strong>Compra segura</strong><span>Pagamento processado com segurança e pedido atualizado pela loja.</span></article>
        </div>
      </div>
    </section>
  );
}

export default Delivery;
