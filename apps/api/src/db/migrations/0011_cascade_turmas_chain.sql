ALTER TABLE "turmas"
DROP CONSTRAINT IF EXISTS "turmas_disciplina_id_disciplinas_id_fk";

ALTER TABLE "turmas"
ADD CONSTRAINT "turmas_disciplina_id_disciplinas_id_fk"
FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "turmas_inscritos"
DROP CONSTRAINT IF EXISTS "turmas_inscritos_turma_id_turmas_id_fk";

ALTER TABLE "turmas_inscritos"
ADD CONSTRAINT "turmas_inscritos_turma_id_turmas_id_fk"
FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "turmas_inscritos"
DROP CONSTRAINT IF EXISTS "turmas_inscritos_aluno_id_alunos_ra_fk";

ALTER TABLE "turmas_inscritos"
ADD CONSTRAINT "turmas_inscritos_aluno_id_alunos_ra_fk"
FOREIGN KEY ("aluno_id") REFERENCES "alunos"("ra") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "avaliacoes"
DROP CONSTRAINT IF EXISTS "avaliacoes_turma_id_turmas_id_fk";

ALTER TABLE "avaliacoes"
ADD CONSTRAINT "avaliacoes_turma_id_turmas_id_fk"
FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "avaliacoes_alunos"
DROP CONSTRAINT IF EXISTS "avaliacoes_alunos_avaliacao_id_avaliacoes_id_fk";

ALTER TABLE "avaliacoes_alunos"
ADD CONSTRAINT "avaliacoes_alunos_avaliacao_id_avaliacoes_id_fk"
FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "avaliacoes_alunos"
DROP CONSTRAINT IF EXISTS "avaliacoes_alunos_aluno_id_alunos_ra_fk";

ALTER TABLE "avaliacoes_alunos"
ADD CONSTRAINT "avaliacoes_alunos_aluno_id_alunos_ra_fk"
FOREIGN KEY ("aluno_id") REFERENCES "alunos"("ra") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "aulas"
DROP CONSTRAINT IF EXISTS "aulas_turma_id_turmas_id_fk";

ALTER TABLE "aulas"
ADD CONSTRAINT "aulas_turma_id_turmas_id_fk"
FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "frequencias"
DROP CONSTRAINT IF EXISTS "frequencias_aula_id_aulas_id_fk";

ALTER TABLE "frequencias"
ADD CONSTRAINT "frequencias_aula_id_aulas_id_fk"
FOREIGN KEY ("aula_id") REFERENCES "aulas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "frequencias"
DROP CONSTRAINT IF EXISTS "frequencias_inscricao_id_turmas_inscritos_id_fk";

ALTER TABLE "frequencias"
ADD CONSTRAINT "frequencias_inscricao_id_turmas_inscritos_id_fk"
FOREIGN KEY ("inscricao_id") REFERENCES "turmas_inscritos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

