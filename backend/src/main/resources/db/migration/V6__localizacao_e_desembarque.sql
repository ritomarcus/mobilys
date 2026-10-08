ALTER TABLE participantes ADD COLUMN desembarque_em TIMESTAMPTZ;
ALTER TABLE participantes ADD COLUMN desembarque_ordem INTEGER;
ALTER TABLE participantes ADD CONSTRAINT ck_desembarque CHECK ((desembarque_em IS NULL) = (desembarque_ordem IS NULL));
CREATE TABLE localizacoes (
    viagem_id BIGINT PRIMARY KEY REFERENCES viagens(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    precisao DOUBLE PRECISION NOT NULL CHECK (precisao BETWEEN 0 AND 10000),
    capturada_em TIMESTAMPTZ NOT NULL,
    recebida_em TIMESTAMPTZ NOT NULL
);
