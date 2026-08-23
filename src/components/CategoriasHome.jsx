function CategoriasHome({ produtos = [], selecionarCategoria }) {
  const categorias = [
    { nome: "Camisetas", label: "CAMISETAS" },
    { nome: "Moletons", label: "MOLETONS" },
    { nome: "Bonés", label: "ACESSÓRIOS" },
    { nome: "Ecobags", label: "ECOBAGS" },
  ];

  function imagemDaCategoria(nome) {
    return produtos.find((p) => p.categoria === nome)?.imagem;
  }

  return (
    <section id="categorias-home" className="categorias-home">
      <div className="container">
        <div className="categorias-home-header">
          <div>
            <p className="eyebrow">Explore a coleção</p>
            <h2 className="section-titulo">Escolha sua missão.</h2>
          </div>
          <p>Do básico ao destaque. Encontre a peça que combina com sua identidade.</p>
        </div>

        <div className="categorias-home-grid">
          {categorias.map((categoria) => {
            const imagem = imagemDaCategoria(categoria.nome);
            return (
              <button
                key={categoria.nome}
                type="button"
                className="categoria-home-card"
                onClick={() => selecionarCategoria(categoria.nome)}
              >
                {imagem && <img src={imagem} alt="" />}
                <span className="categoria-home-overlay" />
                <span className="categoria-home-content">
                  <strong>{categoria.label}</strong>
                  <small>VER COLEÇÃO</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CategoriasHome;
