# Mission Store

Loja React + Vite com Netlify Functions, Netlify Database (PostgreSQL) e pagamento
por PIX e cartão via Mercado Pago (Payment Brick).

## Rodar localmente

```bash
npm install
npm run dev          # só o visual (usa o catálogo local como fallback)
npx netlify dev      # ambiente completo: /api/*, banco e pagamento
```

Copie `.env.example` para `.env` e preencha as variáveis (nunca suba o `.env`).

## Estrutura

- `src/` — site (loja) e painel `/admin`.
- `netlify/functions/` — API (`/api/*`).
- `netlify/database/migrations/` — banco. São aplicadas em ordem alfabética
  (001, 0022, 002, 003, 004, 005, 006). O nome `0022_pedidos.sql` foi mantido
  de propósito: renomear uma migration já aplicada pode quebrar o banco.
- `public/imagens/produtos/` — fotos dos produtos (veja abaixo).

## Fotos dos produtos

O catálogo espera arquivos `.jpg` em `public/imagens/produtos/` com estes nomes:
`moletom-concreto`, `moletom-zip-vazio`, `moletom-fe-urbana`, `camiseta-mission`,
`camiseta-estatica`, `camiseta-proposito`, `bone-trucker`, `bone-aba-curva`,
`bone-missao`, `ecobag-mub`. Enquanto uma foto não existir, a loja mostra um
espaço reservado em vez de imagem quebrada.

## Colocar no ar (passo a passo)

1. `npm install` e `npm run build` (confirme que o build passa).
2. Suba o projeto para o GitHub e conecte o repositório ao Netlify.
3. Provisione o Netlify Database. As migrations rodam no deploy.
4. Em **Site configuration > Environment variables**, cadastre tudo que está
   em `.env.example`.
5. No painel do Mercado Pago, em Webhooks, cadastre
   `https://SEU-SITE/api/pagamento-webhook` para o evento **Pagamentos** e
   copie a chave secreta para `MERCADOPAGO_WEBHOOK_SECRET`.
6. Teste tudo com credenciais de **teste** (cenários em `MERCADO_PAGO.md`).
7. Só então troque para as credenciais de produção e refaça o passo 5 com a
   URL final.

## Painel admin

`/admin` — login com `ADMIN_PASSWORD`. Use senha longa e um `ADMIN_SECRET`
diferente. Após 5 senhas erradas, o IP fica bloqueado por 15 minutos.

## Pedidos que precisam de atenção

Se o cliente pagar e o estoque tiver acabado no meio tempo, o pedido vira
`estoque_indisponivel`. Com `ESTORNO_AUTOMATICO=true` o estorno é feito sozinho;
sem isso, estorne manualmente no painel do Mercado Pago.
