import CardProduto from "./CardProduto";

function Destaques({
  produtos,
  tamanhosSelecionados,
  selecionarTamanho,
  adicionarAoCarrinho,
  quantidadeDoProdutoNoCarrinho,
}) {
  if (!produtos.length) return null;

  return (
    <section className="container section" style={{ paddingBottom: 0 }}>
      <p className="eyebrow">Seleção da casa</p>
      <h2 className="section-titulo" style={{ marginBottom: 30 }}>Destaques</h2>

      <div className="produtos-grid">
        {produtos.map((produto) => (
          <CardProduto
            key={produto.id}
            produto={produto}
            tamanhoSelecionado={tamanhosSelecionados[produto.id]}
            onSelecionarTamanho={selecionarTamanho}
            onAdicionar={adicionarAoCarrinho}
            quantidadeJaNoCarrinho={quantidadeDoProdutoNoCarrinho(produto.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default Destaques;
