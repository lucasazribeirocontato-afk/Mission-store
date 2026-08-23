import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  desativarProduto,
} from "./adminApi";

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizarEstoque(tamanhos, estoquePorTamanho, estoqueFallback = 0) {
  const lista = Array.isArray(tamanhos) ? tamanhos : [];
  const origem = estoquePorTamanho && typeof estoquePorTamanho === "object"
    ? estoquePorTamanho
    : {};
  return lista.reduce((acc, tamanho) => {
    acc[tamanho] = Number.isInteger(Number(origem[tamanho]))
      ? Math.max(0, Number(origem[tamanho]))
      : (lista.length === 1 ? Math.max(0, Number(estoqueFallback) || 0) : 0);
    return acc;
  }, {});
}

const PRODUTO_VAZIO = {
  id: null,
  nome: "",
  categoria: "Camisetas",
  preco: "",
  cor: "",
  tamanhos: "P,M,G,GG",
  estoque: "",
  estoquePorTamanho: {},
  novo: false,
  destaque: false,
  imagem: "",
  ativo: true,
};

export default function AdminProdutos({ token, onNaoAutorizado }) {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [formulario, setFormulario] = useState(PRODUTO_VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const dados = await listarProdutos(token);
      setProdutos(dados.produtos);
    } catch (error) {
      if (error.naoAutorizado) return onNaoAutorizado();
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirNovo() {
    setFormulario(PRODUTO_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(produto) {
    setFormulario({
      ...produto,
      tamanhos: Array.isArray(produto.tamanhos)
        ? produto.tamanhos.join(",")
        : "",
      estoquePorTamanho: produto.estoque_por_tamanho || {},
    });
    setModalAberto(true);
  }

  async function salvar(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");

    const tamanhos = formulario.tamanhos
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const estoque_por_tamanho = normalizarEstoque(
      tamanhos,
      formulario.estoquePorTamanho,
      formulario.estoque
    );

    const payload = {
      ...formulario,
      preco: Number(formulario.preco),
      estoque: Object.values(estoque_por_tamanho).reduce((soma, valor) => soma + valor, 0),
      tamanhos,
      estoque_por_tamanho,
    };

    try {
      if (formulario.id) {
        await atualizarProduto(token, payload);
      } else {
        await criarProduto(token, payload);
      }

      setModalAberto(false);
      await carregar();
    } catch (error) {
      if (error.naoAutorizado) return onNaoAutorizado();
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(produto) {
    const confirmou = window.confirm(
      `Desativar "${produto.nome}"? Ele deixa de aparecer na loja, mas o histórico de pedidos é mantido.`
    );

    if (!confirmou) return;

    try {
      await desativarProduto(token, produto.id);
      await carregar();
    } catch (error) {
      if (error.naoAutorizado) return onNaoAutorizado();
      setErro(error.message);
    }
  }

  return (
    <div className="admin-secao">
      <div className="admin-secao-topo">
        <h2>Produtos</h2>
        <button type="button" className="botao botao-solido" onClick={abrirNovo}>
          <Plus size={16} />
          Novo produto
        </button>
      </div>

      {erro && (
        <div className="admin-erro" role="alert">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="admin-vazio">Carregando produtos...</p>
      ) : (
        <div className="admin-tabela-wrap">
          <table className="admin-tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Destaque</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr
                  key={produto.id}
                  className={
                    produto.ativo === false ? "admin-linha-inativa" : ""
                  }
                >
                  <td>{produto.nome}</td>
                  <td>{produto.categoria}</td>
                  <td>{formatarPreco(produto.preco)}</td>
                  <td
                    className={
                      Number(produto.estoque) === 0
                        ? "admin-estoque-zero"
                        : ""
                    }
                  >
                    {produto.estoque}
                    <small className="admin-estoque-detalhe">
                      ({Object.entries(produto.estoque_por_tamanho || {})
                        .map(([tamanho, quantidade]) => `${tamanho}: ${quantidade}`)
                        .join(" · ")})
                    </small>
                  </td>
                  <td>{produto.destaque ? "Sim" : "—"}</td>
                  <td>{produto.ativo === false ? "Inativo" : "Ativo"}</td>
                  <td className="admin-acoes">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(produto)}
                      aria-label={`Editar ${produto.nome}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => desativar(produto)}
                      aria-label={`Desativar ${produto.nome}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="admin-modal-overlay" role="presentation">
          <form className="admin-modal" onSubmit={salvar}>
            <header className="admin-modal-header">
              <h3>{formulario.id ? "Editar produto" : "Novo produto"}</h3>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </header>

            <div className="admin-modal-grid">
              <label>
                <span>Nome *</span>
                <input
                  value={formulario.nome}
                  onChange={(e) =>
                    setFormulario({ ...formulario, nome: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                <span>Categoria *</span>
                <select
                  value={formulario.categoria}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      categoria: e.target.value,
                    })
                  }
                >
                  <option>Moletons</option>
                  <option>Camisetas</option>
                  <option>Bonés</option>
                  <option>Ecobags</option>
                </select>
              </label>

              <label>
                <span>Preço (R$) *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.preco}
                  onChange={(e) =>
                    setFormulario({ ...formulario, preco: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                <span>Estoque total</span>
                <input
                  type="number"
                  value={Object.values(formulario.estoquePorTamanho || {}).reduce((soma, valor) => soma + Number(valor || 0), 0)}
                  readOnly
                  aria-readonly="true"
                />
              </label>

              <label>
                <span>Cor *</span>
                <input
                  value={formulario.cor}
                  onChange={(e) =>
                    setFormulario({ ...formulario, cor: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                <span>Tamanhos (separados por vírgula)</span>
                <input
                  value={formulario.tamanhos}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      tamanhos: e.target.value,
                    })
                  }
                  placeholder="P,M,G,GG ou Único"
                />
              </label>

              <div className="admin-estoque-tamanhos admin-modal-full">
                <div className="admin-campo-titulo">
                  <span>Estoque por tamanho *</span>
                  <small>Defina quantas unidades existem de cada tamanho.</small>
                </div>
                <div className="admin-estoque-grid">
                  {formulario.tamanhos
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tamanho) => (
                      <label key={tamanho} className="admin-estoque-item">
                        <span>{tamanho}</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formulario.estoquePorTamanho?.[tamanho] ?? ""}
                          onChange={(e) =>
                            setFormulario({
                              ...formulario,
                              estoquePorTamanho: {
                                ...(formulario.estoquePorTamanho || {}),
                                [tamanho]: Math.max(0, Number(e.target.value) || 0),
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                </div>
                <p className="admin-estoque-total">
                  Estoque total: <strong>{Object.values(formulario.estoquePorTamanho || {}).reduce((soma, valor) => soma + Number(valor || 0), 0)}</strong>
                </p>
              </div>

              <label className="admin-modal-full">
                <span>Imagem (caminho)</span>
                <input
                  value={formulario.imagem || ""}
                  onChange={(e) =>
                    setFormulario({ ...formulario, imagem: e.target.value })
                  }
                  placeholder="/imagens/produtos/exemplo.jpg"
                />
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={!!formulario.novo}
                  onChange={(e) =>
                    setFormulario({ ...formulario, novo: e.target.checked })
                  }
                />
                <span>Marcar como novo</span>
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={!!formulario.destaque}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      destaque: e.target.checked,
                    })
                  }
                />
                <span>Destacar na home</span>
              </label>

              {formulario.id && (
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={formulario.ativo !== false}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        ativo: e.target.checked,
                      })
                    }
                  />
                  <span>Produto ativo na loja</span>
                </label>
              )}
            </div>

            <div className="admin-modal-acoes">
              <button
                type="button"
                className="botao botao-contorno"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="botao botao-solido"
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
