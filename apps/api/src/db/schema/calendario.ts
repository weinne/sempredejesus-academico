import { pgTable, serial, integer, varchar, date, text } from 'drizzle-orm/pg-core';
import { semestres } from './semestres';

export const calendario = pgTable('calendario', {
  id: serial('id').primaryKey(),
  semestreId: integer('semestre_id').notNull().references(() => semestres.id),
  evento: varchar('evento', { length: 100 }).notNull(),
  inicio: date('inicio').notNull(),
  termino: date('termino').notNull(),
  obs: text('obs'),
});

export type Calendario = typeof calendario.$inferSelect;
export type NewCalendario = typeof calendario.$inferInsert; 