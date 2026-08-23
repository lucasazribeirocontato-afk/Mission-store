-- Mission Store: suporte ao Payment Brick.
-- Reaproveita as colunas de pagamento já criadas em 004_pagamentos.sql
-- (pagamento_id, pagamento_status, pagamento_preferencia_id, pagamento_atualizado_em)
-- e adiciona apenas o que ainda não existe.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS pagamento_metodo TEXT,
  ADD COLUMN IF NOT EXISTS estoque_processado BOOLEAN NOT NULL DEFAULT FALSE;

-- Reforço de idempotência explícito pedido no fluxo do Payment Brick:
-- o webhook só baixa estoque se estoque_processado ainda for FALSE,
-- em vez de depender só da comparação de pagamento_id.
CREATE INDEX IF NOT EXISTS idx_pedidos_estoque_processado ON pedidos(estoque_processado);
