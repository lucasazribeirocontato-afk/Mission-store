-- Mission Store: estoque por tamanho
-- Migração segura: mantém o estoque total existente e distribui a quantidade
-- entre os tamanhos existentes. Depois disso, o estoque total passa a ser a
-- soma de estoque_por_tamanho.

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS estoque_por_tamanho JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE produtos
SET estoque_por_tamanho = COALESCE(
  (
    SELECT jsonb_object_agg(
      tamanho,
      to_jsonb(
        (estoque / qtd_tamanhos) +
        CASE WHEN ordem <= (estoque % qtd_tamanhos) THEN 1 ELSE 0 END
      )
    )
    FROM (
      SELECT
        tamanho,
        ROW_NUMBER() OVER () AS ordem,
        COUNT(*) OVER () AS qtd_tamanhos
      FROM jsonb_array_elements_text(COALESCE(produtos.tamanhos, '[]'::jsonb)) AS t(tamanho)
    ) distribuicao
  ),
  '{}'::jsonb
)
WHERE estoque_por_tamanho = '{}'::jsonb
  AND jsonb_array_length(COALESCE(tamanhos, '[]'::jsonb)) > 0;

-- Produtos de tamanho único usam o estoque antigo diretamente.
UPDATE produtos
SET estoque_por_tamanho = jsonb_build_object(
  COALESCE(tamanhos->>0, 'Único'),
  estoque
)
WHERE jsonb_array_length(COALESCE(tamanhos, '[]'::jsonb)) = 1;

-- Garante que o estoque geral seja sempre a soma dos tamanhos.
UPDATE produtos
SET estoque = COALESCE(
  (
    SELECT SUM(value::integer)
    FROM jsonb_each_text(estoque_por_tamanho)
  ),
  0
);

CREATE INDEX IF NOT EXISTS idx_produtos_estoque_tamanho
  ON produtos USING GIN (estoque_por_tamanho);
