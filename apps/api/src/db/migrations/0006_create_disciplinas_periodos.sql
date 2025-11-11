-- Create relation table between disciplinas and periodos
CREATE TABLE IF NOT EXISTS disciplinas_periodos (
  id SERIAL PRIMARY KEY,
  disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  periodo_id INTEGER NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  ordem SMALLINT,
  obrigatoria BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS disciplinas_periodos_disciplina_periodo_unique
  ON disciplinas_periodos (disciplina_id, periodo_id);

CREATE INDEX IF NOT EXISTS disciplinas_periodos_periodo_idx
  ON disciplinas_periodos (periodo_id);

CREATE INDEX IF NOT EXISTS disciplinas_periodos_disciplina_idx
  ON disciplinas_periodos (disciplina_id);

-- Drop legacy foreign key and column on disciplinas
ALTER TABLE disciplinas
  DROP CONSTRAINT IF EXISTS disciplinas_periodo_id_fkey;

ALTER TABLE disciplinas
  DROP COLUMN IF EXISTS periodo_id;

