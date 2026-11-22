import { ShoppingBag, X, Minus, Plus, Trash2 } from "lucide-react";

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function chaveItem(id, tamanho) {
  return `${id}-${tamanho}`;
}

function Carrinho({
  aberto,
  fechar,
  carrinho,
  totalCarrinho,
  aumentarQuantidade,
  diminuirQuantidade,
  removerDoCarrinho,
  limparCarrinho,
  finalizarPedido,
}) {
  if (!aberto) return null;

  return (
    <div
      role="presentation"
      onClick={fechar}
      className="carrinho-overlay"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        onClick={(e) => e.stopPropagation()}
        className="carrinho"
      >
        <div className="carrinho-header">
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>Seu pedido</p>
            <h2>Carrinho</h2>
          </div>

          <button type="button" onClick={fechar} aria-label="Fechar carrinho">
            <X size={24} />
          </button>
        </div>

        <div className="carrinho-lista">
          {carrinho.length === 0 ? (
            <div className="carrinho-vazio">
              <ShoppingBag size={44} strokeWidth={1} />
              <p>Seu carrinho está vazio.</p>
            </div>
          ) : (
            <>
              {carrinho.map((item) => {
                const limite = item.quantidade >= item.estoque;

                return (
                  <div
                    key={chaveItem(item.id, item.tamanho)}
                    className="carrinho-item"
                  >
                    <div className="carrinho-foto">
                      {item.imagem ? (
                        <img src={item.imagem} alt={item.nome} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                      ) : (
                        <span>FOTO</span>
                      )}
                    </div>

                    <div className="carrinho-info">
                      <strong>{item.nome}</strong>
                      <p>Tamanho {item.tamanho}</p>
                      <p>{formatarPreco(item.preco)}</p>

                      <div className="quantidade">
                        <button
                          type="button"
                          onClick={() => diminuirQuantidade(item)}
                          aria-label="Diminuir quantidade"
                        >
                          <Minus size={14} />
                        </button>

                        <span>{item.quantidade}</span>

                        <button
                          type="button"
                          onClick={() => aumentarQuantidade(item)}
                          disabled={limite}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removerDoCarrinho(item)}
                          className="remover"
                          aria-label="Remover item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={limparCarrinho}
                className="limpar-carrinho"
              >
                Limpar carrinho
              </button>
            </>
          )}
        </div>

        {carrinho.length > 0 && (
          <div className="carrinho-footer">
            <div className="carrinho-total">
              <strong>Total</strong>
              <strong>{formatarPreco(totalCarrinho)}</strong>
            </div>

            <button type="button" onClick={finalizarPedido} className="finalizar">
              Finalizar pedido
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

export default Carrinho;
