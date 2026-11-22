-- Mission Store: segurança do checkout e do login do admin.

-- Token aleatório por pedido: só quem criou o pedido (e recebeu o token na
-- resposta de /api/pedidos) consegue iniciar o pagamento dele. Sem isso, como
-- os IDs são sequenciais, qualquer pessoa poderia mexer no pagamento de
-- pedidos de outros clientes.
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS token_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS estorno_id TEXT;

-- Controle de tentativas de login do painel admin (anti força-bruta).
CREATE TABLE IF NOT EXISTS admin_login_tentativas (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_login_tentativas_ip
  ON admin_login_tentativas(ip, criado_em DESC);
