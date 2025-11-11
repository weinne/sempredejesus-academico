import { pgTable, serial, integer, smallint, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { disciplinas } from './disciplinas';
import { periodos } from './periodos';

export const disciplinasPeriodos = pgTable(
  'disciplinas_periodos',
  {
    id: serial('id').primaryKey(),
    disciplinaId: integer('disciplina_id')
      .notNull()
      .references(() => disciplinas.id, { onDelete: 'cascade' }),
    periodoId: integer('periodo_id')
      .notNull()
      .references(() => periodos.id, { onDelete: 'cascade' }),
    ordem: smallint('ordem'),
    obrigatoria: boolean('obrigatoria').notNull().default(true),
  },
  (table) => ({
    disciplinaPeriodoUnique: uniqueIndex('disciplinas_periodos_disciplina_periodo_unique').on(
      table.disciplinaId,
      table.periodoId,
    ),
  })
);

export type DisciplinaPeriodo = typeof disciplinasPeriodos.$inferSelect;
export type NewDisciplinaPeriodo = typeof disciplinasPeriodos.$inferInsert;

