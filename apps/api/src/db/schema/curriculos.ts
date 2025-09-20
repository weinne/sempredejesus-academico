import { pgTable, serial, integer, varchar, boolean, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { cursos } from './cursos';
import { turnos } from './turnos';

export const curriculos = pgTable(
  'curriculos',
  {
    id: serial('id').primaryKey(),
    cursoId: integer('curso_id').notNull().references(() => cursos.id, { onDelete: 'cascade' }),
    turnoId: integer('turno_id').notNull().references(() => turnos.id, { onDelete: 'restrict' }),
    versao: varchar('versao', { length: 40 }).notNull(),
    vigenteDe: date('vigente_de'),
    vigenteAte: date('vigente_ate'),
    ativo: boolean('ativo').notNull().default(true),
  },
  (table) => ({
    cursoTurnoVersaoUnique: uniqueIndex('curriculos_curso_turno_versao_unique').on(table.cursoId, table.turnoId, table.versao),
  })
);

export type Curriculo = typeof curriculos.$inferSelect;
export type NewCurriculo = typeof curriculos.$inferInsert;


