ALTER TABLE "alunos"
DROP CONSTRAINT IF EXISTS "alunos_pessoa_id_pessoas_id_fk";

ALTER TABLE "alunos"
ADD CONSTRAINT "alunos_pessoa_id_pessoas_id_fk"
FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "users"
DROP CONSTRAINT IF EXISTS "users_pessoa_id_pessoas_id_fk";

ALTER TABLE "users"
ADD CONSTRAINT "users_pessoa_id_pessoas_id_fk"
FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "professores"
DROP CONSTRAINT IF EXISTS "professores_pessoa_id_pessoas_id_fk";

ALTER TABLE "professores"
ADD CONSTRAINT "professores_pessoa_id_pessoas_id_fk"
FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

