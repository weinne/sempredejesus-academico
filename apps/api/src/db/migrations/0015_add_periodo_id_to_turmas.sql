ALTER TABLE "turmas"
ADD COLUMN "periodo_id" integer;

ALTER TABLE "turmas"
ADD CONSTRAINT "turmas_periodo_id_periodos_id_fk"
FOREIGN KEY ("periodo_id") REFERENCES "periodos" ("id") ON DELETE SET NULL;

