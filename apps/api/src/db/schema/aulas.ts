import { pgTable, serial, integer, date, text, varchar } from 'drizzle-orm/pg-core';
import { turmas } from './turmas';

export const aulas = pgTable('aulas', {
  id: serial('id').primaryKey(),
  turmaId: integer('turma_id').notNull().references(() => turmas.id),
  data: date('data').notNull(),
  topico: text('topico'),
  materialUrl: text('material_url'),
  observacao: text('observacao'),
});

export type Aula = typeof aulas.$inferSelect;
export type NewAula = typeof aulas.$inferInsert; 