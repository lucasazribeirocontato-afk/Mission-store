import { useState } from "react";
import { LoaderCircle, Lock } from "lucide-react";

import { login } from "./adminApi";

export default function AdminLogin({ onEntrar }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(event) {
    event.preventDefault();
    setErro("");

    if (!senha.trim()) {
      setErro("Informe a senha.");
      return;
    }

    setEnviando(true);

    try {
      const dados = await login(senha.trim());
      onEntrar(dados.token);
    } catch (error) {
      setErro(error.message || "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={enviar}>
        <div className="admin-login-icone">
          <Lock size={26} />
        </div>

        <p className="eyebrow">Mission Store · Administração</p>
        <h1>Acesso restrito</h1>

        <label>
          <span>Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            autoFocus
            autoComplete="current-password"
          />
        </label>

        {erro && (
          <div className="admin-erro" role="alert">
            {erro}
          </div>
        )}

        <button
          type="submit"
          className="botao botao-solido"
          disabled={enviando}
        >
          {enviando ? (
            <>
              <LoaderCircle size={17} className="checkout-spinner" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>
    </div>
  );
}
