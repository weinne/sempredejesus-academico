CREATE TABLE IF NOT EXISTS "periodos" (
  "id" serial PRIMARY KEY NOT NULL,
  "curso_id" integer NOT NULL REFERENCES "cursos"("id") ON DELETE CASCADE,
  "numero" smallint NOT NULL,
  "nome" varchar(80),
  "descricao" text,
  CONSTRAINT "periodos_curso_numero_unique" UNIQUE ("curso_id", "numero")
);

ALTER TABLE "disciplinas" ADD COLUMN IF NOT EXISTS "periodo_id" integer;
ALTER TABLE "disciplinas"
  ADD CONSTRAINT "disciplinas_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "periodos"("id") ON DELETE RESTRICT;

ALTER TABLE "alunos" ADD COLUMN IF NOT EXISTS "periodo_id" integer;
ALTER TABLE "alunos"
  ADD CONSTRAINT "alunos_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "periodos"("id") ON DELETE RESTRICT;

-- Create default period (Periodo 1) for each curso when migrating existing data
INSERT INTO "periodos" ("curso_id", "numero", "nome")
SELECT c."id", 1, 'Período 1'
FROM "cursos" c
ON CONFLICT ("curso_id", "numero") DO NOTHING;

UPDATE "disciplinas" d
SET "periodo_id" = p."id"
FROM "periodos" p
WHERE p."curso_id" = d."curso_id" AND p."numero" = 1 AND d."periodo_id" IS NULL;

UPDATE "alunos" a
SET "periodo_id" = p."id"
FROM "periodos" p
WHERE p."curso_id" = a."curso_id" AND p."numero" = 1 AND a."periodo_id" IS NULL;

ALTER TABLE "disciplinas" ALTER COLUMN "periodo_id" SET NOT NULL;
ALTER TABLE "alunos" ALTER COLUMN "periodo_id" SET NOT NULL;
