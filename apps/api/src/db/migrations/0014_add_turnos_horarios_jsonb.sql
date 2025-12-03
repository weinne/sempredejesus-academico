ALTER TABLE "turnos"
ADD COLUMN "horarios" jsonb NOT NULL DEFAULT '[]'::jsonb;

