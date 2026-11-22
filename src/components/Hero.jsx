function Hero({ irParaProdutos, produtos = [] }) {
  const destaqueA = produtos[0]?.imagem;
  const destaqueB = produtos[1]?.imagem;

  return (
    <section id="topo" className="hero">
      <div className="container hero-grid">
        <div className="hero-conteudo">
          <p className="eyebrow">Mission Store · Estilo com propósito</p>

          <h1>
            VISTA SUA
            <br />
            <span>ESSÊNCIA.</span>
          </h1>

          <p className="hero-titulo-marca">MISSION STORE</p>

          <p className="hero-descricao">
            Mais que roupas, um propósito.
            <br />
            Estilo que representa quem você é.
          </p>

          <div className="hero-acoes">
            <button type="button" onClick={irParaProdutos} className="botao botao-solido">
              Ver produtos
            </button>
            <a href="#missao" className="botao botao-contorno">
              Nossa missão
            </a>
          </div>
        </div>

        <div className="hero-produtos" aria-hidden="true">
          <div className="hero-oval"></div>

          {destaqueA && (
            <div className="hero-produto hero-produto-a">
              <img src={destaqueA} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
            </div>
          )}

          {destaqueB && (
            <div className="hero-produto hero-produto-b">
              <img src={destaqueB} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;
