import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Mission from "./components/Mission";
import CategoriasHome from "./components/CategoriasHome";
import Destaques from "./components/Destaques";
import Produtos from "./components/Produtos";
import Carrinho from "./components/Carrinho";
import Checkout from "./components/Checkout";
import CTA from "./components/CTA";
import Mapa from "./components/Mapa";
import Footer from "./components/Footer";
import Delivery from "./components/Delivery";
import RastrearPedido from "./components/RastrearPedido";
import ComoComprar from "./components/ComoComprar";
import UltimasUnidades from "./components/UltimasUnidades";

import { CATEGORIAS } from "./config/loja";

import { PRODUTOS } from "./data/produtos";

import "./styles/global.css";

const CHAVE_CARRINHO =
  "mission-store-carrinho";

const CHAVE_TEMA =
  "mission-tema";

function chaveItem(id, tamanho) {
  return `${id}-${tamanho}`;
}

export default function App() {
  // ==========================================================
  // TEMA
  // ==========================================================

  const [tema, setTema] = useState(() => {
    try {
      return (
        localStorage.getItem(CHAVE_TEMA) ||
        "dark"
      );
    } catch {
      return "dark";
    }
  });

  // ==========================================================
  // CATEGORIA
  // ==========================================================

  const [categoria, setCategoria] =
    useState("Tudo");

  // Produtos vêm do banco em produção. Durante o desenvolvimento comum
  // (npm run dev), mantemos o catálogo local como fallback.
  const [produtos, setProdutos] = useState(PRODUTOS);

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      try {
        const resposta = await fetch("/api/produtos", {
          headers: { Accept: "application/json" },
        });

        if (!resposta.ok) throw new Error("API indisponível");

        const dados = await resposta.json();
        if (!ativo || !Array.isArray(dados.produtos)) return;

        setProdutos(
          dados.produtos.map((produto) => ({
            ...produto,
            tamanhos: Array.isArray(produto.tamanhos) ? produto.tamanhos : ["Único"],
            estoque_por_tamanho:
              produto.estoque_por_tamanho && typeof produto.estoque_por_tamanho === "object"
                ? produto.estoque_por_tamanho
                : {},
          }))
        );
      } catch {
        // Vite puro não sobe as Netlify Functions; usamos o catálogo local.
      }
    }

    carregarProdutos();
    return () => { ativo = false; };
  }, []);

  // ==========================================================
  // BUSCA
  // ==========================================================

  const [busca, setBusca] =
    useState("");

  // ==========================================================
  // CARRINHO
  // ==========================================================

  const [carrinho, setCarrinho] =
    useState(() => {
      try {
        const salvo =
          localStorage.getItem(
            CHAVE_CARRINHO
          );

        return salvo
          ? JSON.parse(salvo)
          : [];
      } catch {
        return [];
      }
    });

  const [carrinhoAberto, setCarrinhoAberto] =
    useState(false);

  const [checkoutAberto, setCheckoutAberto] =
    useState(false);

  // ==========================================================
  // TAMANHOS
  // ==========================================================

  const [
    tamanhosSelecionados,
    setTamanhosSelecionados,
  ] = useState({});

  // ==========================================================
  // APLICAR TEMA
  // ==========================================================

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      tema
    );

    try {
      localStorage.setItem(
        CHAVE_TEMA,
        tema
      );
    } catch {
      // Continua funcionando mesmo sem localStorage.
    }
  }, [tema]);

  // ==========================================================
  // ALTERNAR TEMA
  // ==========================================================

  function alternarTema() {
    setTema((atual) =>
      atual === "dark"
        ? "light"
        : "dark"
    );
  }

  // ==========================================================
  // SALVAR CARRINHO
  // ==========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(carrinho)
      );
    } catch {
      // Continua funcionando mesmo sem localStorage.
    }
  }, [carrinho]);

  // ==========================================================
  // BLOQUEAR SCROLL DO CARRINHO
  // ==========================================================

  useEffect(() => {
    document.body.style.overflow =
      carrinhoAberto || checkoutAberto
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [carrinhoAberto, checkoutAberto]);

  // ==========================================================
  // FECHAR CARRINHO COM ESC
  // ==========================================================

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setCarrinhoAberto(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // ==========================================================
  // PRODUTOS FILTRADOS
  // ==========================================================

  const produtosFiltrados =
    useMemo(() => {
      const termo =
        busca.trim().toLowerCase();

      return produtos.filter(
        (produto) => {
          const categoriaOk =
            categoria === "Tudo" ||
            produto.categoria ===
              categoria;

          const buscaOk =
            !termo ||
            produto.nome
              .toLowerCase()
              .includes(termo) ||
            produto.categoria
              .toLowerCase()
              .includes(termo) ||
            produto.cor
              .toLowerCase()
              .includes(termo);

          return (
            categoriaOk &&
            buscaOk
          );
        }
      );
    }, [categoria, busca, produtos]);

  // ==========================================================
  // DESTAQUES
  // ==========================================================

  const destaques = useMemo(
    () => produtos.filter((produto) => produto.destaque && Number(produto.estoque) > 0),
    [produtos]
  );

  // ==========================================================
  // QUANTIDADE DE UM PRODUTO NO CARRINHO
  // ==========================================================

  function estoqueDoTamanho(produto, tamanho) {
    const mapa = produto?.estoque_por_tamanho || {};
    if (Object.prototype.hasOwnProperty.call(mapa, tamanho)) return Number(mapa[tamanho]) || 0;
    return produto?.tamanhos?.length === 1 ? Number(produto.estoque) || 0 : 0;
  }

  function quantidadeDoProdutoNoCarrinho(produtoId, tamanho = null) {
    return carrinho
      .filter((item) => item.id === produtoId && (tamanho === null || item.tamanho === tamanho))
      .reduce((total, item) => total + item.quantidade, 0);
  }

  function selecionarTamanho(
    produtoId,
    tamanho
  ) {
    setTamanhosSelecionados(
      (atual) => ({
        ...atual,
        [produtoId]: tamanho,
      })
    );
  }

  // ==========================================================
  // ADICIONAR AO CARRINHO
  // ==========================================================

  function adicionarAoCarrinho(produto) {
    const tamanho = produto.tamanhos.length === 1 ? produto.tamanhos[0] : tamanhosSelecionados[produto.id];
    if (!tamanho) {
      alert("Selecione um tamanho.");
      return;
    }

    const estoqueDisponivel = estoqueDoTamanho(produto, tamanho);
    const quantidadeAtual = quantidadeDoProdutoNoCarrinho(produto.id, tamanho);

    if (estoqueDisponivel <= 0) {
      alert(`O tamanho ${tamanho} está esgotado.`);
      return;
    }
    if (quantidadeAtual >= estoqueDisponivel) {
      alert(`Você já adicionou todas as unidades disponíveis do tamanho ${tamanho}.`);
      return;
    }

    const chave = chaveItem(produto.id, tamanho);
    setCarrinho((atual) => {
      const existente = atual.find((item) => chaveItem(item.id, item.tamanho) === chave);
      if (existente) {
        return atual.map((item) =>
          chaveItem(item.id, item.tamanho) === chave
            ? { ...item, quantidade: item.quantidade + 1, estoque: estoqueDisponivel }
            : item
        );
      }
      return [...atual, { ...produto, tamanho, quantidade: 1, estoque: estoqueDisponivel }];
    });
    setCarrinhoAberto(true);
  }

  // ==========================================================
  // AUMENTAR QUANTIDADE
  // ==========================================================



  function aumentarQuantidade(item) {
    const estoqueDisponivel = estoqueDoTamanho(item, item.tamanho);
    const quantidadeAtual = quantidadeDoProdutoNoCarrinho(item.id, item.tamanho);
    if (quantidadeAtual >= estoqueDisponivel) {
      alert(`Não há mais estoque do tamanho ${item.tamanho}.`);
      return;
    }
    const chave = chaveItem(item.id, item.tamanho);
    setCarrinho((atual) =>
      atual.map((i) =>
        chaveItem(i.id, i.tamanho) === chave
          ? { ...i, quantidade: i.quantidade + 1, estoque: estoqueDisponivel }
          : i
      )
    );
  }

  // ==========================================================
  // DIMINUIR QUANTIDADE
  // ==========================================================

  function diminuirQuantidade(item) {
    const chave = chaveItem(item.id, item.tamanho);
    setCarrinho((atual) =>
      atual
        .map((i) =>
          chaveItem(i.id, i.tamanho) === chave
            ? { ...i, quantidade: i.quantidade - 1 }
            : i
        )
        .filter((i) => i.quantidade > 0)
    );
  }

  // ==========================================================
  // REMOVER DO CARRINHO
  // ==========================================================

  function removerDoCarrinho(
    item
  ) {
    const chave = chaveItem(
      item.id,
      item.tamanho
    );

    setCarrinho((atual) =>
      atual.filter(
        (i) =>
          chaveItem(
            i.id,
            i.tamanho
          ) !== chave
      )
    );
  }

  // ==========================================================
  // LIMPAR CARRINHO
  // ==========================================================

  function limparCarrinho() {
    if (!carrinho.length) {
      return;
    }

    const confirmou =
      window.confirm(
        "Deseja limpar o carrinho?"
      );

    if (!confirmou) {
      return;
    }

    setCarrinho([]);
  }

  // ==========================================================
  // QUANTIDADE TOTAL
  // ==========================================================

  const quantidadeCarrinho =
    carrinho.reduce(
      (total, item) =>
        total + item.quantidade,
      0
    );

  // ==========================================================
  // TOTAL DO CARRINHO
  // ==========================================================

  const totalCarrinho =
    carrinho.reduce(
      (total, item) =>
        total +
        item.preco *
          item.quantidade,
      0
    );

  // ==========================================================
  // FINALIZAR PEDIDO
  // ==========================================================

  function finalizarPedido() {
    if (!carrinho.length) {
      alert("Seu carrinho está vazio.");
      return;
    }

    setCarrinhoAberto(false);
    setCheckoutAberto(true);
  }

  function pedidoCriado() {
    setCarrinho([]);
    setCheckoutAberto(true);
  }

  // ==========================================================
  // IR PARA PRODUTOS
  // ==========================================================

  function irParaProdutos() {
    document
      .getElementById("produtos")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="app">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <Header
        busca={busca}
        setBusca={setBusca}
        quantidadeCarrinho={
          quantidadeCarrinho
        }
        abrirCarrinho={() =>
          setCarrinhoAberto(true)
        }
        tema={tema}
        alternarTema={alternarTema}
      />

      {/* ====================================================
          HERO
      ==================================================== */}

      <Hero
        irParaProdutos={irParaProdutos}
        produtos={destaques}
      />

      <CategoriasHome
        produtos={produtos}
        selecionarCategoria={(categoriaSelecionada) => {
          setCategoria(categoriaSelecionada);
          document.getElementById("produtos")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      />

      {/* ====================================================
          MISSÃO
      ==================================================== */}

      <Mission />

      {/* ====================================================
          DESTAQUES
      ==================================================== */}

      <Destaques
        produtos={destaques}
        tamanhosSelecionados={tamanhosSelecionados}
        selecionarTamanho={selecionarTamanho}
        adicionarAoCarrinho={adicionarAoCarrinho}
        quantidadeDoProdutoNoCarrinho={quantidadeDoProdutoNoCarrinho}
      />

      <UltimasUnidades
        produtos={produtos}
        tamanhosSelecionados={tamanhosSelecionados}
        selecionarTamanho={selecionarTamanho}
        adicionarAoCarrinho={adicionarAoCarrinho}
        quantidadeDoProdutoNoCarrinho={quantidadeDoProdutoNoCarrinho}
      />

      {/* ====================================================
          PRODUTOS
      ==================================================== */}

      <Produtos
        produtos={produtosFiltrados}
        categorias={CATEGORIAS}
        categoria={categoria}
        setCategoria={setCategoria}
        busca={busca}
        tamanhosSelecionados={
          tamanhosSelecionados
        }
        selecionarTamanho={
          selecionarTamanho
        }
        adicionarAoCarrinho={
          adicionarAoCarrinho
        }
        quantidadeDoProdutoNoCarrinho={
          quantidadeDoProdutoNoCarrinho
        }
      />

      <Delivery />

      <ComoComprar />

      <RastrearPedido />

      {/* ====================================================
          CTA
      ==================================================== */}

      <CTA />

      {/* ====================================================
          MAPA
      ==================================================== */}

      <Mapa />

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <Footer />

      {/* ====================================================
          CARRINHO
      ==================================================== */}

      <Carrinho
        aberto={carrinhoAberto}
        fechar={() =>
          setCarrinhoAberto(false)
        }
        carrinho={carrinho}
        totalCarrinho={totalCarrinho}
        diminuirQuantidade={
          diminuirQuantidade
        }
        aumentarQuantidade={
          aumentarQuantidade
        }
        removerDoCarrinho={
          removerDoCarrinho
        }
        limparCarrinho={
          limparCarrinho
        }
        finalizarPedido={
          finalizarPedido
        }
      />

      <Checkout
        aberto={checkoutAberto}
        fechar={() => setCheckoutAberto(false)}
        carrinho={carrinho}
        totalCarrinho={totalCarrinho}
        onPedidoCriado={pedidoCriado}
      />

    </div>
  );
}