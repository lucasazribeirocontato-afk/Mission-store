import { Moon, Sun } from "lucide-react";

function ThemeToggle({ tema, alternarTema }) {
  const modoEscuro = tema === "dark";

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={modoEscuro ? "Ativar modo claro" : "Ativar modo escuro"}
      title={modoEscuro ? "Modo claro" : "Modo escuro"}
      className="theme-toggle"
    >
      {modoEscuro ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}

export default ThemeToggle;
