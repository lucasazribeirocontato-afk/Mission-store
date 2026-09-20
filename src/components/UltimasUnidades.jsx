import CardProduto from "./CardProduto";

function UltimasUnidades({ produtos, tamanhosSelecionados, selecionarTamanho, adicionarAoCarrinho, quantidadeDoProdutoNoCarrinho }) {
  const itens = produtos.filter((produto) => Number(produto.estoque) > 0 && Number(produto.estoque) <= 3).slice(0, 4);
  if (!itens.length) return null;

  return (
    <section className="container section low-stock-section">
      <div className="section-heading-inline">
        <div>
          <p className="eyebrow">Estoque limitado</p>
          <h2 className="section-titulo">Últimas unidades.</h2>
        </div>
        <span>Quando acabar, acabou.</span>
      </div>
      <div className="produtos-grid">
        {itens.map((produto) => (
          <CardProduto
            key={produto.id}
            produto={produto}
            tamanhoSelecionado={tamanhosSelecionados[produto.id]}
            onSelecionarTamanho={selecionarTamanho}
            onAdicionar={adicionarAoCarrinho}
            quantidadeJaNoCarrinho={quantidadeDoProdutoNoCarrinho(produto.id, tamanhosSelecionados[produto.id] || (produto.tamanhos?.length === 1 ? produto.tamanhos[0] : null))}
          />
        ))}
      </div>
    </section>
  );
}

export default UltimasUnidades;
