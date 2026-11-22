CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  cor TEXT NOT NULL,
  tamanhos JSONB NOT NULL DEFAULT '[]'::jsonb,
  estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  estoque_por_tamanho JSONB NOT NULL DEFAULT '{}'::jsonb,
  novo BOOLEAN NOT NULL DEFAULT FALSE,
  destaque BOOLEAN NOT NULL DEFAULT FALSE,
  imagem TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO produtos (id, nome, categoria, preco, cor, tamanhos, estoque, estoque_por_tamanho, novo, destaque, imagem)
VALUES
(1, 'Moletom Concreto', 'Moletons', 249.90, 'Cinza Chumbo', '["P","M","G","GG"]', 10, '{"P":2,"M":3,"G":3,"GG":2}', TRUE, TRUE, '/imagens/produtos/moletom-concreto.jpg'),
(2, 'Moletom Zip Vazio', 'Moletons', 279.90, 'Grafite', '["P","M","G","GG"]', 10, '{"P":2,"M":3,"G":3,"GG":2}', FALSE, FALSE, '/imagens/produtos/moletom-zip-vazio.jpg'),
(3, 'Moletom Fé Urbana', 'Moletons', 259.90, 'Azul Emblema', '["P","M","G","GG"]', 4, '{"P":1,"M":1,"G":1,"GG":1}', TRUE, TRUE, '/imagens/produtos/moletom-fe-urbana.jpg'),
(4, 'Camiseta Mission', 'Camisetas', 99.90, 'Off White', '["P","M","G","GG"]', 10, '{"P":2,"M":3,"G":3,"GG":2}', FALSE, TRUE, '/imagens/produtos/camiseta-mission.jpg'),
(5, 'Camiseta Estática', 'Camisetas', 109.90, 'Preto', '["P","M","G","GG"]', 10, '{"P":2,"M":3,"G":3,"GG":2}', TRUE, TRUE, '/imagens/produtos/camiseta-estatica.jpg'),
(6, 'Camiseta Propósito', 'Camisetas', 104.90, 'Creme', '["P","M","G","GG"]', 10, '{"P":2,"M":3,"G":3,"GG":2}', FALSE, FALSE, '/imagens/produtos/camiseta-proposito.jpg'),
(7, 'Boné Trucker', 'Bonés', 89.90, 'Azul Emblema', '["Único"]', 2, '{"Único":2}', FALSE, FALSE, '/imagens/produtos/bone-trucker.jpg'),
(8, 'Boné Aba Curva', 'Bonés', 94.90, 'Creme', '["Único"]', 10, '{"Único":10}', FALSE, FALSE, '/imagens/produtos/bone-aba-curva.jpg'),
(9, 'Boné Missão', 'Bonés', 99.90, 'Preto', '["Único"]', 0, '{"Único":0}', FALSE, FALSE, '/imagens/produtos/bone-missao.jpg'),
(10, 'Ecobag MUB', 'Ecobags', 49.90, 'Preto', '["Único"]', 3, '{"Único":3}', TRUE, TRUE, '/imagens/produtos/ecobag-mub.jpg')
ON CONFLICT (id) DO NOTHING;
