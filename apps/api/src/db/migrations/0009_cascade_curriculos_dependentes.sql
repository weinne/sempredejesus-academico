ALTER TABLE "periodos"
DROP CONSTRAINT IF EXISTS "periodos_curriculo_id_curriculos_id_fk";

ALTER TABLE "periodos"
ADD CONSTRAINT "periodos_curriculo_id_curriculos_id_fk"
FOREIGN KEY ("curriculo_id") REFERENCES "curriculos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "coortes"
DROP CONSTRAINT IF EXISTS "coortes_curriculo_id_curriculos_id_fk";

ALTER TABLE "coortes"
ADD CONSTRAINT "coortes_curriculo_id_curriculos_id_fk"
FOREIGN KEY ("curriculo_id") REFERENCES "curriculos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

