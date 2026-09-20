import { ShoppingBag, CreditCard, Package, Heart } from "lucide-react";

function ComoComprar() {
  const passos = [
    [ShoppingBag, "Escolha suas peças", "Explore as coleções e escolha seus tamanhos."],
    [Heart, "Monte seu carrinho", "Revise as peças, quantidades e seu pedido."],
    [CreditCard, "Pague com segurança", "Finalize o pedido e siga para o pagamento."],
    [Package, "Receba sua missão", "Acompanhe o pedido e aguarde a entrega no RS ou SC."],
  ];

  return (
    <section className="how section" id="como-comprar">
      <div className="container">
        <p className="eyebrow">Passo a passo</p>
        <h2 className="section-titulo">Como comprar.</h2>
        <div className="how-grid">
          {passos.map(([Icon, titulo, texto], index) => (
            <article key={titulo}>
              <span className="how-number">0{index + 1}</span>
              <Icon size={23}/>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ComoComprar;
