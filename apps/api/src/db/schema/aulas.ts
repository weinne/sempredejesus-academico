import { pgTable, serial, integer, date, text, varchar, time } from 'drizzle-orm/pg-core';
import { turmas } from './turmas';

export const aulas = pgTable('aulas', {
  id: serial('id').primaryKey(),
  turmaId: integer('turma_id')
    .notNull()
    .references(() => turmas.id, { onDelete: 'cascade' }),
  data: date('data').notNull(),
  horaInicio: time('hora_inicio'),
  horaFim: time('hora_fim'),
  topico: text('topico'),
  materialUrl: text('material_url'),
  observacao: text('observacao'),
});

export type Aula = typeof aulas.$inferSelect;
export type NewAula = typeof aulas.$inferInsert; 