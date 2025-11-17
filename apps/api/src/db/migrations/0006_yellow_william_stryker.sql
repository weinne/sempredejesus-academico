CREATE TABLE IF NOT EXISTS "disciplinas_periodos" (
	"id" serial PRIMARY KEY NOT NULL,
	"disciplina_id" integer NOT NULL,
	"periodo_id" integer NOT NULL,
	"ordem" smallint,
	"obrigatoria" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alunos" DROP CONSTRAINT "alunos_curso_id_cursos_id_fk";
--> statement-breakpoint
ALTER TABLE "coortes" DROP CONSTRAINT "coortes_curriculo_id_curriculos_id_fk";
--> statement-breakpoint
ALTER TABLE "disciplinas" DROP CONSTRAINT "disciplinas_periodo_id_periodos_id_fk";
--> statement-breakpoint
ALTER TABLE "disciplinas" DROP CONSTRAINT "disciplinas_curso_id_cursos_id_fk";
--> statement-breakpoint
ALTER TABLE "periodos" DROP CONSTRAINT "periodos_curso_id_cursos_id_fk";
--> statement-breakpoint
ALTER TABLE "periodos" DROP CONSTRAINT "periodos_turno_id_turnos_id_fk";
--> statement-breakpoint
ALTER TABLE "periodos" DROP CONSTRAINT "periodos_curriculo_id_curriculos_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "periodos_curso_numero_unique";--> statement-breakpoint
ALTER TABLE "aulas" ADD COLUMN "hora_inicio" time;--> statement-breakpoint
ALTER TABLE "aulas" ADD COLUMN "hora_fim" time;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "disciplinas_periodos_disciplina_periodo_unique" ON "disciplinas_periodos" ("disciplina_id","periodo_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "periodos_curriculo_numero_unique" ON "periodos" ("curriculo_id","numero");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alunos" ADD CONSTRAINT "alunos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coortes" ADD CONSTRAINT "coortes_curriculo_id_curriculos_id_fk" FOREIGN KEY ("curriculo_id") REFERENCES "curriculos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "periodos" ADD CONSTRAINT "periodos_curriculo_id_curriculos_id_fk" FOREIGN KEY ("curriculo_id") REFERENCES "curriculos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "disciplinas" DROP COLUMN IF EXISTS "periodo_id";--> statement-breakpoint
ALTER TABLE "periodos" DROP COLUMN IF EXISTS "curso_id";--> statement-breakpoint
ALTER TABLE "periodos" DROP COLUMN IF EXISTS "turno_id";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinas_periodos" ADD CONSTRAINT "disciplinas_periodos_disciplina_id_disciplinas_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplinas_periodos" ADD CONSTRAINT "disciplinas_periodos_periodo_id_periodos_id_fk" FOREIGN KEY ("periodo_id") REFERENCES "periodos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
