# O que foi alterado nesta versão

## Corrigido (era problema real)
1. **Migrations** estavam em `netlify/functions/database/migrations/` (o Netlify
   não aplica dali). Agora estão em `netlify/database/migrations/`.
2. **Webhook** podia baixar o estoque em dobro com notificações simultâneas.
   Agora usa reivindicação atômica; se falhar no meio, devolve o estoque e
   libera o pedido para nova tentativa.
3. **Pedidos de terceiros** podiam ser cancelados por qualquer pessoa via
   `/api/process-payment`. Agora exige o `token` do pedido (migration 006).
4. **Pago sem estoque**: pedido vai para `estoque_indisponivel` e, opcionalmente
   (`ESTORNO_AUTOMATICO=true`), é estornado sozinho.
5. **Estorno/chargeback** depois de aprovado agora atualiza o status do pagamento
   (antes era ignorado).
6. **Imagens quebradas**: sem a foto, a loja mostra o espaço reservado.

## Melhorias
- Login do admin: bloqueio após 5 tentativas em 15 min, comparação sem vazar o
  tamanho da senha.
- Telefone validado (mínimo 10 dígitos) e pedido "vazio" apagado se falhar
  ao gravar os itens.
- `index.html`: título, idioma pt-BR, descrição, favicon (`public/favicon.svg`).
- `.gitignore` e `.env.example` criados.
- `netlify.toml`: cabeçalhos de segurança e cache de assets.
- Removidos: `pagamento.mjs` (Checkout Pro antigo, sem uso),
  `PAGAMENTO_MERCADOPAGO.md`, `src/utils/carrinho.js` (vazio).
- Pacote renomeado para `mission-store`; READMEs atualizados.

## Como foi verificado
- Sintaxe de todas as Functions (`node --check`).
- Fluxos do webhook, pagamento, criação de pedido e login rodados com banco e
  Mercado Pago **simulados** (16 verificações, todas ok).
- **Não** foi possível rodar `npm install`/`npm run build` nem testar contra o
  Postgres e o Mercado Pago reais (sem rede aqui). Faça isso antes de vender.
