import { Search, X, ShoppingBag } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

function Header({
  busca,
  setBusca,
  quantidadeCarrinho,
  abrirCarrinho,
  tema,
  alternarTema,
}) {
  return (
    <header className="header">
      <div className="container header-inner">
        <a href="#topo" aria-label="Ir para o início" className="logo">
          <img src="/imagens/Logo.png" alt="Mission Store" />
        </a>

        <nav className="header-nav" aria-label="Navegação principal">
          <a href="#topo">Início</a>
          <a href="#produtos">Produtos</a>
          <a href="#categorias-home">Categorias</a>
          <a href="#missao">Sobre nós</a>
          <a href="#contato">Contato</a>
        </nav>

        <div className="header-acoes">
          <label className="busca busca-compacta">
            <Search size={20} />
            <input
              type="search"
              placeholder="Buscar..."
              aria-label="Buscar produto"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="busca-limpar"
              >
                <X size={17} />
              </button>
            )}
          </label>

          <ThemeToggle tema={tema} alternarTema={alternarTema} />

          <button
            type="button"
            onClick={abrirCarrinho}
            aria-label="Abrir carrinho"
            className="botao-carrinho"
          >
            <ShoppingBag size={22} />
            {quantidadeCarrinho > 0 && <span>{quantidadeCarrinho}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
