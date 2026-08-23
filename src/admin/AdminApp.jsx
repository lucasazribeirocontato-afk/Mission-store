import { useEffect, useState } from "react";

import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";

import "../styles/admin.css";

const CHAVE_TOKEN = "mission-admin-token";

export default function AdminApp() {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_TOKEN) || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    // O admin sempre usa o tema escuro, independente do que o
    // visitante da loja tiver escolhido no navegador.
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  function entrar(novoToken) {
    setToken(novoToken);

    try {
      localStorage.setItem(CHAVE_TOKEN, novoToken);
    } catch {
      // Sem localStorage, a sessão só dura enquanto a aba estiver aberta.
    }
  }

  function sair() {
    setToken("");

    try {
      localStorage.removeItem(CHAVE_TOKEN);
    } catch {
      // Nada a fazer.
    }
  }

  return (
    <div className="admin-app">
      {token ? (
        <AdminPanel token={token} onSair={sair} />
      ) : (
        <AdminLogin onEntrar={entrar} />
      )}
    </div>
  );
}
