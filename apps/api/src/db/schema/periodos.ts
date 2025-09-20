import { pgTable, serial, integer, smallint, varchar, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { cursos } from './cursos';

export const periodos = pgTable(
  'periodos',
  {
    id: serial('id').primaryKey(),
    cursoId: integer('curso_id')
      .notNull()
      .references(() => cursos.id, { onDelete: 'cascade' }),
    numero: smallint('numero').notNull(),
    nome: varchar('nome', { length: 80 }),
    descricao: text('descricao'),
  },
  (table) => ({
    cursoNumeroIdx: uniqueIndex('periodos_curso_numero_unique').on(table.cursoId, table.numero),
  })
);

export type Periodo = typeof periodos.$inferSelect;
export type NewPeriodo = typeof periodos.$inferInsert;
