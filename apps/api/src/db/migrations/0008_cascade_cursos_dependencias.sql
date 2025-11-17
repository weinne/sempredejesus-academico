ALTER TABLE "alunos"
DROP CONSTRAINT IF EXISTS "alunos_curso_id_cursos_id_fk";

ALTER TABLE "alunos"
ADD CONSTRAINT "alunos_curso_id_cursos_id_fk"
FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "disciplinas"
DROP CONSTRAINT IF EXISTS "disciplinas_curso_id_cursos_id_fk";

ALTER TABLE "disciplinas"
ADD CONSTRAINT "disciplinas_curso_id_cursos_id_fk"
FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

