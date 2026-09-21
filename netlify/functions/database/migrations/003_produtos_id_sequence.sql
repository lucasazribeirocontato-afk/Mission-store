-- Evita colisões de ID quando dois administradores cadastram produtos ao mesmo tempo.
CREATE SEQUENCE IF NOT EXISTS produtos_id_seq;

SELECT setval(
  'produtos_id_seq',
  GREATEST(COALESCE((SELECT MAX(id) FROM produtos), 0), 1),
  true
);

ALTER TABLE produtos
  ALTER COLUMN id SET DEFAULT nextval('produtos_id_seq');

ALTER SEQUENCE produtos_id_seq OWNED BY produtos.id;
