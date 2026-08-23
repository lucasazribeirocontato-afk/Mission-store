import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  listarPedidos,
  detalharPedido,
  atualizarStatusPedido,
} from "./adminApi";

const STATUS_LABEL = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_preparacao: "Em preparação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  estoque_indisponivel: "Estoque requer atenção",
};

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor) {
  return new Date(valor).toLocaleString("pt-BR");
}

export default function AdminPedidos({ token, onNaoAutorizado }) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [itensPorPedido, setItensPorPedido] = useState({});

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const dados = await listarPedidos(token);
      setPedidos(dados.pedidos);
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

  async function alternarDetalhes(pedido) {
    if (expandido === pedido.id) {
      setExpandido(null);
      return;
    }

    setExpandido(pedido.id);

    if (!itensPorPedido[pedido.id]) {
      try {
        const dados = await detalharPedido(token, pedido.id);
        setItensPorPedido((atual) => ({
          ...atual,
          [pedido.id]: dados.itens,
        }));
      } catch (error) {
        if (error.naoAutorizado) return onNaoAutorizado();
        setErro(error.message);
      }
    }
  }

  async function mudarStatus(pedido, novoStatus) {
    const statusAnterior = pedido.status;

    setPedidos((atual) =>
      atual.map((p) =>
        p.id === pedido.id ? { ...p, status: novoStatus } : p
      )
    );

    try {
      await atualizarStatusPedido(token, pedido.id, novoStatus);
    } catch (error) {
      if (error.naoAutorizado) return onNaoAutorizado();

      setErro(error.message);

      // desfaz a mudança otimista se o backend recusou
      setPedidos((atual) =>
        atual.map((p) =>
          p.id === pedido.id ? { ...p, status: statusAnterior } : p
        )
      );
    }
  }

  return (
    <div className="admin-secao">
      <div className="admin-secao-topo">
        <h2>Pedidos</h2>
      </div>

      {erro && (
        <div className="admin-erro" role="alert">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="admin-vazio">Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className="admin-vazio">Nenhum pedido registrado ainda.</p>
      ) : (
        <div className="admin-tabela-wrap">
          <table className="admin-tabela">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Total</th>
                <th>Pagamento</th>
                <th>Método</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <Fragment key={pedido.id}>
                  <tr>
                    <td>{pedido.codigo}</td>
                    <td>{pedido.nome_cliente}</td>
                    <td>{pedido.telefone}</td>
                    <td>{formatarPreco(pedido.total)}</td>
                    <td>
                      <span className="admin-pagamento-status">
                        {pedido.pagamento_status || "pendente"}
                      </span>
                    </td>
                    <td>{pedido.pagamento_metodo || "—"}</td>
                    <td>
                      <select
                        value={pedido.status}
                        onChange={(e) => mudarStatus(pedido, e.target.value)}
                      >
                        {Object.entries(STATUS_LABEL).map(
                          ([valor, rotulo]) => (
                            <option key={valor} value={valor}>
                              {rotulo}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                    <td>{formatarData(pedido.criado_em)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => alternarDetalhes(pedido)}
                        aria-label="Ver itens do pedido"
                      >
                        {expandido === pedido.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>
                  </tr>

                  {expandido === pedido.id && (
                    <tr className="admin-linha-detalhes">
                      <td colSpan={9}>
                        {pedido.pagamento_id && (
                          <p className="admin-vazio">
                            ID do pagamento (Mercado Pago): {pedido.pagamento_id}
                            {" · "}
                            Estoque {pedido.estoque_processado ? "processado" : "ainda não processado"}
                          </p>
                        )}
                        {!itensPorPedido[pedido.id] ? (
                          <p className="admin-vazio">Carregando itens...</p>
                        ) : (
                          <ul className="admin-itens-pedido">
                            {itensPorPedido[pedido.id].map((item) => (
                              <li key={item.id}>
                                {item.quantidade}× {item.produto_nome} (tam.{" "}
                                {item.tamanho}) —{" "}
                                {formatarPreco(item.preco * item.quantidade)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
