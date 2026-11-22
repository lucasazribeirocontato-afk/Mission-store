-- Mission Store: pagamentos via Mercado Pago + baixa de estoque somente após aprovação.
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS pagamento_status TEXT NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS pagamento_id TEXT,
  ADD COLUMN IF NOT EXISTS pagamento_preferencia_id TEXT,
  ADD COLUMN IF NOT EXISTS pagamento_atualizado_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pedidos_pagamento_id ON pedidos(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_pagamento_preferencia ON pedidos(pagamento_preferencia_id);
