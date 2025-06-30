import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const cursos = pgTable('cursos', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 80 }).notNull(),
  grau: varchar('grau', { length: 30 }).notNull(),
});

export type Curso = typeof cursos.$inferSelect;
export type NewCurso = typeof cursos.$inferInsert; 