# Próximas etapas — Mission Store

## Implementado nesta V3 (Payment Brick)

- [x] Painel administrativo protegido por token.
- [x] CRUD de produtos.
- [x] Estoque por tamanho.
- [x] Tabela de pedidos e itens.
- [x] Checkout com dados do cliente.
- [x] Pagamento embutido via Payment Brick (`@mercadopago/sdk-react`), PIX e cartão.
- [x] `netlify/functions/process-payment.mjs` recalculando o valor no backend antes de processar.
- [x] Webhook de pagamento com validação de assinatura (mantido da V2).
- [x] Baixa de estoque somente após pagamento aprovado, guardada por `estoque_processado`.
- [x] Idempotência explícita (`estoque_processado`) para evitar baixa duplicada.
- [x] Status e método de pagamento no painel administrativo.
- [x] Removido o endpoint público `/api/pedidos-lista` (expunha dados de clientes sem login).

## Configuração necessária antes da produção

- [ ] Definir `MERCADOPAGO_ACCESS_TOKEN` na Netlify.
- [ ] Definir `VITE_MERCADOPAGO_PUBLIC_KEY` na Netlify (e em `.env` local).
- [ ] Definir `MERCADOPAGO_WEBHOOK_SECRET` na Netlify.
- [ ] Definir `SITE_URL` na Netlify.
- [ ] Rodar `npm install` para baixar `@mercadopago/sdk-react`.
- [ ] Rodar as migrations 001 a 005 em ordem.
- [ ] Configurar Webhook do Mercado Pago para `/api/pagamento-webhook`.
- [ ] Testar os 7 cenários descritos em `MERCADO_PAGO.md` com credenciais de teste.
- [ ] Depois dos testes, trocar para credenciais de produção.
- [ ] Conferir imagens reais dos produtos.

## Fluxo definitivo

Cliente -> checkout -> pedido pendente -> Payment Brick (PIX/cartão) -> Mercado Pago -> webhook aprovado -> baixa do estoque -> pedido confirmado.

Veja `MERCADO_PAGO.md` para os detalhes completos da integração.
