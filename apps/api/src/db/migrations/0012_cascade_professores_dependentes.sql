ALTER TABLE "turmas"
DROP CONSTRAINT IF EXISTS "turmas_professor_id_professores_matricula_fk";

ALTER TABLE "turmas"
ADD CONSTRAINT "turmas_professor_id_professores_matricula_fk"
FOREIGN KEY ("professor_id") REFERENCES "professores"("matricula") ON DELETE CASCADE ON UPDATE NO ACTION;

