import { pgTable, serial, integer, varchar, date, text } from 'drizzle-orm/pg-core';
import { periodos } from './periodos';

export const calendario = pgTable('calendario', {
  id: serial('id').primaryKey(),
  evento: varchar('evento', { length: 100 }).notNull(),
  inicio: date('inicio').notNull(),
  termino: date('termino').notNull(),
  obs: text('obs'),
  periodoId: integer('periodo_id').references(() => periodos.id),
});

export type Calendario = typeof calendario.$inferSelect;
export type NewCalendario = typeof calendario.$inferInsert; 