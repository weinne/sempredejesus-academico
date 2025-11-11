-- Drop legacy unique index that enforced uniqueness por curso
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'periodos_curso_numero_unique') THEN
    EXECUTE 'DROP INDEX IF EXISTS periodos_curso_numero_unique';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM periodos
    GROUP BY curriculo_id, numero
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicated periodos found for the same curriculo/numero. Resolve them before proceeding.';
  END IF;
END $$;

-- Create the new unique index scoped to curriculo
CREATE UNIQUE INDEX IF NOT EXISTS periodos_curriculo_numero_unique ON periodos (curriculo_id, numero);

