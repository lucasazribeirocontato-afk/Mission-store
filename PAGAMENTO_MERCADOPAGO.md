> ⚠️ **Documento histórico.** O projeto migrou de Checkout Pro para
> Payment Brick. Veja `MERCADO_PAGO.md` para a integração atual.

# Mission Store — PIX e cartão com Mercado Pago (versão anterior, Checkout Pro)

A V2 usa o Checkout Pro do Mercado Pago. O Checkout Pro permite oferecer os meios de pagamento disponíveis na conta, incluindo PIX e cartão, e a preferência é criada no backend.

## Variáveis na Netlify

Configure:

- `MERCADOPAGO_ACCESS_TOKEN` — Access Token da aplicação do Mercado Pago.
- `MERCADOPAGO_WEBHOOK_SECRET` — chave secreta gerada em Mercado Pago > Sua integração > Webhooks.
- `SITE_URL` — URL pública da loja, por exemplo `https://sua-loja.netlify.app`.

Nunca coloque o Access Token no React/frontend.

## Fluxo

1. Cliente envia os dados do checkout.
2. `/api/pedidos` cria o pedido com pagamento `pendente`.
3. O estoque NÃO é baixado.
4. `/api/pagamento` cria a preferência no Mercado Pago.
5. Cliente é levado ao Checkout Pro para PIX/cartão.
6. Mercado Pago chama `/api/pagamento-webhook`.
7. O webhook valida a assinatura.
8. O backend consulta o pagamento diretamente no Mercado Pago.
9. Somente com `approved` e valor pago suficiente o estoque é baixado.
10. O pedido passa para `confirmado`.

O webhook é idempotente: uma notificação repetida para um pagamento já processado não baixa o estoque novamente.

## Configuração do Webhook

Na aplicação do Mercado Pago, configure Webhooks para eventos de pagamento e use:

`https://SUA-DOMINIO/api/pagamento-webhook`

A URL precisa ser pública e HTTPS em produção.

## Teste

Use primeiro as credenciais de teste do Mercado Pago e faça o fluxo completo:

pedido -> preferência -> checkout -> pagamento aprovado -> webhook -> estoque.

A documentação oficial do Checkout Pro recomenda criar a preferência no servidor, configurar URLs de retorno e notificações e testar antes de ativar as credenciais de produção.
