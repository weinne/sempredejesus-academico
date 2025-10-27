CREATE TABLE IF NOT EXISTS "turnos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(30) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "curriculos" (
	"id" serial PRIMARY KEY NOT NULL,
	"curso_id" integer NOT NULL,
	"turno_id" integer NOT NULL,
	"versao" varchar(40) NOT NULL,
	"vigente_de" date,
	"vigente_ate" date,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coortes" (
	"id" serial PRIMARY KEY NOT NULL,
	"curso_id" integer NOT NULL,
	"turno_id" integer NOT NULL,
	"curriculo_id" integer NOT NULL,
	"ano_ingresso" integer NOT NULL,
	"rotulo" varchar(40) NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "periodos" (
	"id" serial PRIMARY KEY NOT NULL,
	"curso_id" integer NOT NULL,
	"turno_id" integer NOT NULL,
	"curriculo_id" integer NOT NULL,
	"numero" smallint NOT NULL,
	"nome" varchar(80),
	"descricao" text,
	"data_inicio" date,
	"data_fim" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer NOT NULL,
	"action" varchar(20) NOT NULL,
	"old_values" text,
	"new_values" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "turmas" DROP CONSTRAINT "turmas_semestre_id_semestres_id_fk";
--> statement-breakpoint
ALTER TABLE "calendario" DROP CONSTRAINT "calendario_semestre_id_semestres_id_fk";
--> statement-breakpoint
DROP TABLE "semestres";--> statement-breakpoint
ALTER TABLE "alunos" ADD COLUMN "coorte_id" integer;--> statement-breakpoint
ALTER TABLE "alunos" ADD COLUMN "periodo_id" integer;--> statement-breakpoint
ALTER TABLE "alunos" ADD COLUMN "turno_id" integer;--> statement-breakpoint
ALTER TABLE "disciplinas" ADD COLUMN "periodo_id" integer;--> statement-breakpoint
ALTER TABLE "turmas" ADD COLUMN "coorte_id" integer;--> statement-breakpoint
ALTER TABLE "calendario" ADD COLUMN "periodo_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "turnos_nome_unique" ON "turnos" ("nome");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "curriculos_curso_turno_versao_unique" ON "curriculos" ("curso_id","turno_id","versao");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coortes_unique" ON "coortes" ("curso_id","turno_id","curriculo_id","ano_ingresso");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "periodos_curso_numero_unique" ON "periodos" ("curso_id","numero");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_id_role_idx" ON "user_roles" ("user_id","role");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alunos" ADD CONSTRAINT "alunos_coorte_id_coortes_id_fk" FOREIGN KEY ("coorte_id") REFERENCES "coortes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alunos" ADD CONSTRAINT "alunos_periodo_id_periodos_id_fk" FOREIGN KEY ("periodo_id") REFERENCES "periodos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alunos" ADD CONSTRAINT "alunos_turno_id_turnos_id_fk" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_periodo_id_periodos_id_fk" FOREIGN KEY ("periodo_id") REFERENCES "periodos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turmas" ADD CONSTRAINT "turmas_coorte_id_coortes_id_fk" FOREIGN KEY ("coorte_id") REFERENCES "coortes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendario" ADD CONSTRAINT "calendario_periodo_id_periodos_id_fk" FOREIGN KEY ("periodo_id") REFERENCES "periodos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "turmas" DROP COLUMN IF EXISTS "semestre_id";--> statement-breakpoint
ALTER TABLE "calendario" DROP COLUMN IF EXISTS "semestre_id";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "curriculos" ADD CONSTRAINT "curriculos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "curriculos" ADD CONSTRAINT "curriculos_turno_id_turnos_id_fk" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coortes" ADD CONSTRAINT "coortes_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coortes" ADD CONSTRAINT "coortes_turno_id_turnos_id_fk" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coortes" ADD CONSTRAINT "coortes_curriculo_id_curriculos_id_fk" FOREIGN KEY ("curriculo_id") REFERENCES "curriculos"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "periodos" ADD CONSTRAINT "periodos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "periodos" ADD CONSTRAINT "periodos_turno_id_turnos_id_fk" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "periodos" ADD CONSTRAINT "periodos_curriculo_id_curriculos_id_fk" FOREIGN KEY ("curriculo_id") REFERENCES "curriculos"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
