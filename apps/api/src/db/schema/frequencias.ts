import { pgTable, serial, integer, boolean, text } from 'drizzle-orm/pg-core';
import { aulas } from './aulas';
import { turmasInscritos } from './turmas';

export const frequencias = pgTable('frequencias', {
  id: serial('id').primaryKey(),
  aulaId: integer('aula_id').notNull().references(() => aulas.id),
  inscricaoId: integer('inscricao_id').notNull().references(() => turmasInscritos.id),
  presente: boolean('presente').notNull(),
  justificativa: text('justificativa'),
});

export type Frequencia = typeof frequencias.$inferSelect;
export type NewFrequencia = typeof frequencias.$inferInsert; 