ALTER TABLE "alunos"
DROP CONSTRAINT IF EXISTS "alunos_coorte_id_coortes_id_fk";

ALTER TABLE "alunos"
ADD CONSTRAINT "alunos_coorte_id_coortes_id_fk"
FOREIGN KEY ("coorte_id") REFERENCES "coortes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "turmas"
DROP CONSTRAINT IF EXISTS "turmas_coorte_id_coortes_id_fk";

ALTER TABLE "turmas"
ADD CONSTRAINT "turmas_coorte_id_coortes_id_fk"
FOREIGN KEY ("coorte_id") REFERENCES "coortes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

