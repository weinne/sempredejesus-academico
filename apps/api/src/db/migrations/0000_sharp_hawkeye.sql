DO $$ BEGIN
 CREATE TYPE "situacao_aluno" AS ENUM('ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tipo_avaliacao" AS ENUM('PROVA', 'TRABALHO', 'PARTICIPACAO', 'OUTRO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "situacao_professor" AS ENUM('ATIVO', 'INATIVO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "status_inscricao" AS ENUM('MATRICULADO', 'CANCELADO', 'APROVADO', 'REPROVADO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alunos" (
	"ra" char(8) PRIMARY KEY NOT NULL,
	"pessoa_id" integer NOT NULL,
	"curso_id" integer NOT NULL,
	"ano_ingresso" integer NOT NULL,
	"igreja" varchar(120),
	"situacao" "situacao_aluno" DEFAULT 'ATIVO' NOT NULL,
	"coeficiente_acad" numeric(4, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aulas" (
	"id" serial PRIMARY KEY NOT NULL,
	"turma_id" integer NOT NULL,
	"data" date NOT NULL,
	"topico" text,
	"material_url" text,
	"observacao" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "avaliacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"turma_id" integer NOT NULL,
	"data" date NOT NULL,
	"tipo" "tipo_avaliacao" NOT NULL,
	"codigo" varchar(8) NOT NULL,
	"descricao" varchar(50) NOT NULL,
	"peso" smallint NOT NULL,
	"arquivo_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "avaliacoes_alunos" (
	"id" serial PRIMARY KEY NOT NULL,
	"avaliacao_id" integer NOT NULL,
	"aluno_id" char(8) NOT NULL,
	"nota" numeric(5, 2) NOT NULL,
	"obs" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendario" (
    "id" serial PRIMARY KEY NOT NULL,
    "evento" varchar(100) NOT NULL,
    "inicio" date NOT NULL,
    "termino" date NOT NULL,
    "obs" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "configuracoes" (
	"chave" text PRIMARY KEY NOT NULL,
	"valor" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cursos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(80) NOT NULL,
	"grau" varchar(30) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disciplinas" (
	"id" serial PRIMARY KEY NOT NULL,
	"curso_id" integer NOT NULL,
	"codigo" varchar(10) NOT NULL,
	"nome" varchar(120) NOT NULL,
	"creditos" smallint NOT NULL,
	"carga_horaria" integer NOT NULL,
	"ementa" text,
	"bibliografia" text,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "disciplinas_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "frequencias" (
	"id" serial PRIMARY KEY NOT NULL,
	"aula_id" integer NOT NULL,
	"inscricao_id" integer NOT NULL,
	"presente" boolean NOT NULL,
	"justificativa" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pessoas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome_completo" varchar(120) NOT NULL,
	"sexo" char(1) NOT NULL,
	"email" varchar(120),
	"cpf" char(11),
	"data_nasc" date,
	"telefone" varchar(20),
	"endereco" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pessoas_email_unique" UNIQUE("email"),
	CONSTRAINT "pessoas_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"pessoa_id" integer NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"is_active" char(1) DEFAULT 'S' NOT NULL,
	"last_login" timestamp,
	"password_reset_token" varchar(255),
	"password_reset_expires" timestamp,
	"refresh_token" varchar(500),
	"refresh_token_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_pessoa_id_unique" UNIQUE("pessoa_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professores" (
	"matricula" char(8) PRIMARY KEY NOT NULL,
	"pessoa_id" integer NOT NULL,
	"data_inicio" date NOT NULL,
	"formacao_acad" varchar(120),
	"situacao" "situacao_professor" DEFAULT 'ATIVO' NOT NULL
);
--> statement-breakpoint
-- semestres removidos
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "turmas" (
    "id" serial PRIMARY KEY NOT NULL,
    "disciplina_id" integer NOT NULL,
    "professor_id" char(8) NOT NULL,
    "sala" varchar(20),
    "horario" varchar(50),
    "secao" varchar(6)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "turmas_inscritos" (
	"id" serial PRIMARY KEY NOT NULL,
	"turma_id" integer NOT NULL,
	"aluno_id" char(8) NOT NULL,
	"media" numeric(4, 1),
	"frequencia" numeric(5, 2),
	"status" "status_inscricao" DEFAULT 'MATRICULADO' NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alunos" ADD CONSTRAINT "alunos_pessoa_id_pessoas_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alunos" ADD CONSTRAINT "alunos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aulas" ADD CONSTRAINT "aulas_turma_id_turmas_id_fk" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_turma_id_turmas_id_fk" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "avaliacoes_alunos" ADD CONSTRAINT "avaliacoes_alunos_avaliacao_id_avaliacoes_id_fk" FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "avaliacoes_alunos" ADD CONSTRAINT "avaliacoes_alunos_aluno_id_alunos_ra_fk" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("ra") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- FK de semestre removida de calendario
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_aula_id_aulas_id_fk" FOREIGN KEY ("aula_id") REFERENCES "aulas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_inscricao_id_turmas_inscritos_id_fk" FOREIGN KEY ("inscricao_id") REFERENCES "turmas_inscritos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_pessoa_id_pessoas_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professores" ADD CONSTRAINT "professores_pessoa_id_pessoas_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turmas" ADD CONSTRAINT "turmas_disciplina_id_disciplinas_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turmas" ADD CONSTRAINT "turmas_professor_id_professores_matricula_fk" FOREIGN KEY ("professor_id") REFERENCES "professores"("matricula") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turmas" ADD CONSTRAINT "turmas_semestre_id_semestres_id_fk" FOREIGN KEY ("semestre_id") REFERENCES "semestres"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turmas_inscritos" ADD CONSTRAINT "turmas_inscritos_turma_id_turmas_id_fk" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turmas_inscritos" ADD CONSTRAINT "turmas_inscritos_aluno_id_alunos_ra_fk" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("ra") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
