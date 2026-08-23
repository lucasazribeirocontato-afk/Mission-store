import { useState } from "react";
import { LogOut, Package, Receipt } from "lucide-react";

import AdminProdutos from "./AdminProdutos";
import AdminPedidos from "./AdminPedidos";

export default function AdminPanel({ token, onSair }) {
  const [aba, setAba] = useState("produtos");

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Mission Store</p>
          <h1>Painel administrativo</h1>
        </div>

        <button type="button" className="botao botao-contorno" onClick={onSair}>
          <LogOut size={16} />
          Sair
        </button>
      </header>

      <nav className="admin-tabs">
        <button
          type="button"
          className={
            aba === "produtos" ? "admin-tab admin-tab-ativa" : "admin-tab"
          }
          onClick={() => setAba("produtos")}
        >
          <Package size={16} />
          Produtos
        </button>

        <button
          type="button"
          className={
            aba === "pedidos" ? "admin-tab admin-tab-ativa" : "admin-tab"
          }
          onClick={() => setAba("pedidos")}
        >
          <Receipt size={16} />
          Pedidos
        </button>
      </nav>

      <main className="admin-conteudo">
        {aba === "produtos" ? (
          <AdminProdutos token={token} onNaoAutorizado={onSair} />
        ) : (
          <AdminPedidos token={token} onNaoAutorizado={onSair} />
        )}
      </main>
    </div>
  );
}
