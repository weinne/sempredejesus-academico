import { pgTable, serial, integer, varchar, smallint, text, boolean } from 'drizzle-orm/pg-core';
import { cursos } from './cursos';

export const disciplinas = pgTable('disciplinas', {
  id: serial('id').primaryKey(),
  cursoId: integer('curso_id').notNull().references(() => cursos.id),
  codigo: varchar('codigo', { length: 10 }).notNull().unique(),
  nome: varchar('nome', { length: 120 }).notNull(),
  creditos: smallint('creditos').notNull(),
  cargaHoraria: integer('carga_horaria').notNull(),
  ementa: text('ementa'),
  bibliografia: text('bibliografia'),
  ativo: boolean('ativo').notNull().default(true),
});

export type Disciplina = typeof disciplinas.$inferSelect;
export type NewDisciplina = typeof disciplinas.$inferInsert; 