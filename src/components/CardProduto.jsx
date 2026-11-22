import { useState } from "react";

const LIMITE_ESTOQUE_BAIXO = 3;

function estoqueDoTamanho(produto, tamanho) {
  const mapa = produto.estoque_por_tamanho || produto.estoquePorTamanho || {};
  if (Object.prototype.hasOwnProperty.call(mapa, tamanho)) return Number(mapa[tamanho]) || 0;
  return produto.tamanhos?.length === 1 ? Number(produto.estoque) || 0 : 0;
}

function CardProduto({
  produto,
  tamanhoSelecionado,
  onSelecionarTamanho,
  onAdicionar,
  quantidadeJaNoCarrinho,
}) {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const estoqueTotal = Number(produto.estoque) || 0;
  const esgotado = estoqueTotal <= 0;
  const precisaEscolherTamanho = produto.tamanhos.length > 1;
  const tamanhoAtual = tamanhoSelecionado || (produto.tamanhos.length === 1 ? produto.tamanhos[0] : null);
  const estoqueTamanho = tamanhoAtual ? estoqueDoTamanho(produto, tamanhoAtual) : estoqueTotal;
  const estoqueBaixo = !esgotado && estoqueTamanho <= LIMITE_ESTOQUE_BAIXO;

  const podeAdicionar =
    !esgotado &&
    estoqueTamanho > 0 &&
    quantidadeJaNoCarrinho < estoqueTamanho &&
    (!precisaEscolherTamanho || Boolean(tamanhoSelecionado));

  function adicionar() {
    if (!podeAdicionar) {
      if (precisaEscolherTamanho && !tamanhoSelecionado) alert("Selecione um tamanho antes de adicionar.");
      else if (tamanhoAtual && estoqueTamanho <= 0) alert(`O tamanho ${tamanhoAtual} está esgotado.`);
      return;
    }
    onAdicionar(produto);
  }

  return (
    <article className="produto-card">
      <div className="produto-imagem">
        {produto.imagem && !imagemFalhou ? <img src={produto.imagem} alt={produto.nome} loading="lazy" onError={() => setImagemFalhou(true)} /> : <div className="produto-imagem-placeholder"><span>✦</span>FOTO DO PRODUTO</div>}
        {produto.novo && !esgotado && <span className="produto-badge selo">NOVO</span>}
        {esgotado && <span className="produto-badge selo esgotado">ESGOTADO</span>}
      </div>

      <div className="produto-info">
        <p className="produto-categoria">{produto.categoria}</p>
        <h3>{produto.nome}</h3>
        <p className="produto-cor">{produto.cor}</p>
        <p className="produto-preco">{Number(produto.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>

        {!esgotado && tamanhoAtual && estoqueBaixo && (
          <p className="estoque-baixo">
            {estoqueTamanho === 1 ? `Última unidade no tamanho ${tamanhoAtual}` : `${estoqueTamanho} unidades no tamanho ${tamanhoAtual}`}
          </p>
        )}

        {!esgotado && (
          <div className="tamanhos">
            {produto.tamanhos.map((tam) => {
              const estoque = estoqueDoTamanho(produto, tam);
              const selecionado = tamanhoSelecionado === tam || (produto.tamanhos.length === 1 && tam === tamanhoAtual);
              return (
                <button
                  key={tam}
                  type="button"
                  onClick={() => estoque > 0 && onSelecionarTamanho(produto.id, tam)}
                  className={`tamanho${selecionado ? " ativo" : ""}${estoque <= 0 ? " esgotado" : ""}`}
                  disabled={estoque <= 0}
                  title={estoque <= 0 ? `Tamanho ${tam} esgotado` : `${estoque} unidade(s) disponíveis`}
                >
                  {tam}
                </button>
              );
            })}
          </div>
        )}

        <button type="button" onClick={adicionar} disabled={!podeAdicionar} className="produto-adicionar">
          {esgotado ? "Esgotado" : tamanhoAtual && estoqueTamanho <= 0 ? "Tamanho esgotado" : "Adicionar"}
        </button>
      </div>
    </article>
  );
}
export default CardProduto;
