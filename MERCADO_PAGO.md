# Mission Store — Pagamento com Payment Brick (PIX e cartão)

Esta é a documentação atual da integração de pagamento. A versão anterior
(Checkout Pro) foi removida do projeto.

## Por que Payment Brick, e não Checkout Pro

O Payment Brick renderiza o formulário de pagamento (PIX e cartão) dentro
do próprio site, sem redirecionar o cliente para uma página do Mercado
Pago. O Checkout Pro (usado antes) redirecionava para o domínio do
Mercado Pago para concluir o pagamento.

## Variáveis de ambiente na Netlify

| Variável | Onde é usada | Segredo? |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Só nas Netlify Functions (backend) | Sim — nunca no frontend |
| `MERCADOPAGO_WEBHOOK_SECRET` | Validação da assinatura do webhook | Sim |
| `VITE_MERCADOPAGO_PUBLIC_KEY` | Frontend, para inicializar o SDK React | Não — é pública por natureza |
| `SITE_URL` | Montar a `notification_url` do pagamento | Não |
| `ADMIN_PASSWORD` | Login do painel administrativo | Sim |
| `ADMIN_SECRET` | Assinatura do token do admin (use um valor diferente da senha) | Sim |
| `ESTORNO_AUTOMATICO` | Opcional. Com `true`, estorna sozinho se o cliente pagar e o estoque acabar | Não |

A Public Key nunca autoriza cobranças sozinha — ela só permite montar o
formulário do Brick no navegador. Quem processa o pagamento de fato é o
backend, com o Access Token.

## Fluxo

1. Cliente monta o carrinho e vai para o checkout.
2. `POST /api/pedidos` cria o pedido com `status = pendente` e
   `pagamento_status = pendente`. Nenhum estoque é baixado aqui. A resposta
   inclui um `token` aleatório do pedido, que só o criador recebe.
3. O componente `<Payment />` (Payment Brick) é renderizado com o total
   do pedido, só para exibição — quem manda no valor real é o backend.
4. Ao enviar o formulário, o Brick chama `onSubmit`, que envia os dados
   (`formData`) e o `token_pedido` para `POST /api/process-payment`. Sem o
   token correto, o backend responde 404 (impede mexer em pedidos alheios).
5. `process-payment.mjs` busca o pedido no PostgreSQL, usa o `total`
   armazenado no banco (nunca o valor vindo do navegador) e chama
   `POST https://api.mercadopago.com/v1/payments` com o Access Token.
6. O Mercado Pago responde com um status inicial (`approved`, `pending`,
   `in_process` ou `rejected`) — isso já é salvo no pedido, mas **não**
   dispara baixa de estoque.
7. O Mercado Pago também chama `POST /api/pagamento-webhook` de forma
   assíncrona (às vezes mais de uma vez). É o webhook — não a resposta
   do passo 5 — que consulta o pagamento novamente na API do Mercado
   Pago e, só se `approved`, "reivindica" o pedido com um `UPDATE ... WHERE
   estoque_processado = FALSE RETURNING id` (atômico) e então baixa o estoque
   por tamanho. Se duas notificações chegarem juntas, só uma ganha.
8. Quem não ganhar a reivindicação, ou chegar depois, recebe
   `already_processed` e não mexe no estoque (idempotência).
9. Se o pagamento foi aprovado mas o estoque acabou, o que já foi baixado é
   devolvido, o pedido vira `estoque_indisponivel` e, com
   `ESTORNO_AUTOMATICO=true`, o pagamento é estornado.

## PIX e cartão

O `customization.paymentMethods` do Brick está configurado com
`bankTransfer: "all"` (PIX no Brasil), `creditCard: "all"` e
`debitCard: "all"`. Nenhum dado de cartão passa pelo seu backend em
texto puro — o SDK tokeniza o cartão no navegador antes de enviar.

## Testando

1. Configure as variáveis com as credenciais de **teste** do Mercado
   Pago.
2. Rode `npx netlify dev` para ter `/api/*` funcionando localmente.
3. Use os [cartões de teste do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/additional-content/test-cards)
   para simular aprovado, recusado e pendente.
4. Para testar o webhook localmente, configure um túnel (ex.: `ngrok`)
   e aponte o Webhook do Mercado Pago para essa URL temporária.
5. Confirme os 7 cenários abaixo antes de trocar para credenciais de
   produção:
   - Compra aprovada → estoque do tamanho comprado diminui.
   - Compra maior que o estoque disponível → não deve nem chegar a criar
     o pedido (validado em `/api/pedidos`).
   - Pagamento recusado → estoque não muda.
   - Pagamento pendente (comum em PIX) → estoque não muda até aprovar.
   - Webhook duplicado para o mesmo pagamento aprovado → estoque baixa
     uma única vez.
   - Produto sem tamanho (Ecobag, "Único") → baixa corretamente.
   - Dois tamanhos diferentes no mesmo pedido → cada um baixa
     separadamente.
   - Pagar o pedido sem `token_pedido` (ou com token errado) → 404.
   - Aprovar um pedido cujo estoque acabou antes → `estoque_indisponivel`,
     estoque intacto (e estorno, se `ESTORNO_AUTOMATICO=true`).
   - 5 senhas erradas no `/admin` → bloqueio de 15 minutos (429).

## Trocar para produção

Depois que todos os testes acima passarem com credenciais de teste,
troque `MERCADOPAGO_ACCESS_TOKEN`, `VITE_MERCADOPAGO_PUBLIC_KEY` e
`MERCADOPAGO_WEBHOOK_SECRET` pelas credenciais de produção na Netlify e
reconfigure o Webhook no painel do Mercado Pago para a URL final
(`https://SEU-DOMINIO/api/pagamento-webhook`).
