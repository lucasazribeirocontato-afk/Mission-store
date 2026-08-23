import { Search } from "lucide-react";
import CardProduto from "./CardProduto";

function Produtos({
  produtos,
  categoria,
  setCategoria,
  categorias,
  busca,
  tamanhosSelecionados,
  selecionarTamanho,
  adicionarAoCarrinho,
  quantidadeDoProdutoNoCarrinho,
}) {
  return (
    <main id="produtos" className="container section" style={{ scrollMarginTop: 100 }}>
      <div className="produtos-header">
        <div>
          <p className="eyebrow">Shop</p>
          <h2 className="section-titulo">Produtos</h2>
        </div>

        <div className="categorias">
          {categorias.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategoria(item)}
              className={`categoria${categoria === item ? " ativa" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {busca && (
        <p className="produtos-busca-info">
          Resultados para: <strong>"{busca}"</strong>
        </p>
      )}

      <div className="produtos-grid">
        {produtos.map((produto) => (
          <CardProduto
            key={produto.id}
            produto={produto}
            tamanhoSelecionado={tamanhosSelecionados[produto.id]}
            onSelecionarTamanho={selecionarTamanho}
            onAdicionar={adicionarAoCarrinho}
            quantidadeJaNoCarrinho={quantidadeDoProdutoNoCarrinho(
              produto.id,
              tamanhosSelecionados[produto.id] ||
                (produto.tamanhos?.length === 1 ? produto.tamanhos[0] : null)
            )}
          />
        ))}
      </div>

      {produtos.length === 0 && (
        <div className="sem-resultados">
          <Search size={38} strokeWidth={1} />

          <p>Nenhum produto encontrado.</p>

          <button
            type="button"
            onClick={() => setCategoria("Tudo")}
            className="botao botao-solido"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </main>
  );
}

export default Produtos;
