import { pgTable, integer, smallint, date } from 'drizzle-orm/pg-core';

export const semestres = pgTable('semestres', {
  id: integer('id').primaryKey(), // formato YYYYS (ex: 20241)
  ano: integer('ano').notNull(),
  periodo: smallint('periodo').notNull(), // 1 ou 2
  inicio: date('inicio').notNull(),
  termino: date('termino').notNull(),
});

export type Semestre = typeof semestres.$inferSelect;
export type NewSemestre = typeof semestres.$inferInsert; 