# Mission Store — versão com estoque por tamanho

## O que foi alterado
- Estoque individual por tamanho (`P`, `M`, `G`, `GG`, `Único`, etc.).
- Painel admin permite informar a quantidade de cada tamanho.
- Estoque total é calculado automaticamente pela soma dos tamanhos.
- Loja desabilita tamanhos esgotados.
- Carrinho limita a quantidade pelo estoque do tamanho selecionado.
- API de pedidos valida e baixa estoque por tamanho.
- Frete é calculado no servidor (atualmente R$ 0).
- Endpoint público antigo de listagem de pedidos foi removido.
- Destaques passam a reagir às atualizações do catálogo.
- IDs de produtos passam a usar sequence após a migração 003.
- Migrações novas:
  - `002_estoque_por_tamanho.sql`
  - `003_produtos_id_sequence.sql`

## Banco
Execute as migrations na ordem. Em banco já existente:
1. `002_estoque_por_tamanho.sql`
2. `003_produtos_id_sequence.sql`

A migration 002 preserva o estoque existente distribuindo-o entre os tamanhos quando não havia distribuição cadastrada. Depois, ajuste os números reais no painel administrativo.

## Exemplo
Camiseta:
- P = 2
- M = 3
- G = 3
- GG = 2
- Total = 10

Se M for vendido 1 vez:
- M passa para 2
- Total passa para 9
- P/G/GG permanecem iguais.

## Observação
As migrations ficam em `netlify/database/migrations/` (veja o `README.md`).
