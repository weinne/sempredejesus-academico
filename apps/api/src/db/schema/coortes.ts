import { pgTable, serial, integer, varchar, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { cursos } from './cursos';
import { turnos } from './turnos';
import { curriculos } from './curriculos';

export const coortes = pgTable(
  'coortes',
  {
    id: serial('id').primaryKey(),
    cursoId: integer('curso_id').notNull().references(() => cursos.id, { onDelete: 'cascade' }),
    turnoId: integer('turno_id').notNull().references(() => turnos.id, { onDelete: 'restrict' }),
    curriculoId: integer('curriculo_id').notNull().references(() => curriculos.id, { onDelete: 'restrict' }),
    anoIngresso: integer('ano_ingresso').notNull(),
    rotulo: varchar('rotulo', { length: 40 }).notNull(), // Ex.: "2016"
    ativo: boolean('ativo').notNull().default(true),
  },
  (table) => ({
    coorteUnique: uniqueIndex('coortes_unique').on(table.cursoId, table.turnoId, table.curriculoId, table.anoIngresso),
  })
);

export type Coorte = typeof coortes.$inferSelect;
export type NewCoorte = typeof coortes.$inferInsert;


