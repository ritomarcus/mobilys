-- Registros antigos permanecem sem destino: não inferir fatos de viagens passadas.
ALTER TABLE agendamentos ADD COLUMN destino_id BIGINT REFERENCES paradas(id) ON DELETE RESTRICT;
ALTER TABLE participantes ADD COLUMN destino_ordem INTEGER CHECK (destino_ordem > 0);
ALTER TABLE viagem_paradas ADD COLUMN omitida_em TIMESTAMPTZ;
ALTER TABLE viagem_paradas ADD COLUMN motivo_omissao VARCHAR(250);
ALTER TABLE viagem_paradas ADD CONSTRAINT ck_omissao_completa
    CHECK ((omitida_em IS NULL) = (motivo_omissao IS NULL));
