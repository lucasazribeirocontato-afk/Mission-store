const BASE = "/api/admin";

async function chamada(caminho, { token, method = "GET", body } = {}) {
  const resposta = await fetch(`${BASE}${caminho}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const dados = await resposta.json().catch(() => ({}));

  if (resposta.status === 401) {
    const erro = new Error(dados.error || "Sessão expirada. Entre novamente.");
    erro.naoAutorizado = true;
    throw erro;
  }

  if (!resposta.ok) {
    throw new Error(dados.error || "Erro na requisição.");
  }

  return dados;
}

export function login(senha) {
  return chamada("/login", { method: "POST", body: { senha } });
}

export function listarProdutos(token) {
  return chamada("/produtos", { token });
}

export function criarProduto(token, produto) {
  return chamada("/produtos", { token, method: "POST", body: produto });
}

export function atualizarProduto(token, produto) {
  return chamada("/produtos", { token, method: "PUT", body: produto });
}

export function desativarProduto(token, id) {
  return chamada(`/produtos?id=${id}`, { token, method: "DELETE" });
}

export function listarPedidos(token) {
  return chamada("/pedidos", { token });
}

export function detalharPedido(token, id) {
  return chamada(`/pedidos?id=${id}`, { token });
}

export function atualizarStatusPedido(token, id, status) {
  return chamada("/pedidos", { token, method: "PATCH", body: { id, status } });
}
