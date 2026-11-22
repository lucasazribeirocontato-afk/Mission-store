# Próximos passos — Mission Store

## Já feito no código

- [x] Painel admin protegido (token assinado, bloqueio após 5 tentativas).
- [x] CRUD de produtos e estoque por tamanho.
- [x] Pedidos, itens e checkout com dados do cliente.
- [x] PIX/cartão via Payment Brick, valor sempre recalculado no servidor.
- [x] Token por pedido: só quem criou o pedido consegue pagá-lo.
- [x] Webhook com assinatura, idempotente e atômico (notificação duplicada
      não baixa estoque duas vezes).
- [x] Estorno automático opcional quando pago sem estoque.
- [x] Migrations na pasta certa (`netlify/database/migrations`).

## Falta você fazer

- [ ] Colocar as fotos reais em `public/imagens/produtos/` (nomes no README).
- [ ] Rodar `npm install` e `npm run build` e conferir que passa.
- [ ] Conectar ao Netlify, provisionar o banco e cadastrar as variáveis.
- [ ] Configurar o webhook no Mercado Pago.
- [ ] Testar os cenários de `MERCADO_PAGO.md` com credenciais de teste.
- [ ] Trocar para credenciais de produção.
- [ ] Definir o frete (hoje fixo em R$ 0 no servidor, em `pedidos.mjs`).
- [ ] Trocar o link do Instagram em `src/config/loja.js` (hoje é genérico).
