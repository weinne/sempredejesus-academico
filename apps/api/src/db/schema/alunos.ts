import { pgTable, char, integer, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { pessoas } from './pessoas';
import { cursos } from './cursos';
import { periodos } from './periodos';

export const situacaoAlunoEnum = pgEnum('situacao_aluno', ['ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO']);

export const alunos = pgTable('alunos', {
  ra: char('ra', { length: 8 }).primaryKey(),
  pessoaId: integer('pessoa_id').notNull().references(() => pessoas.id),
  cursoId: integer('curso_id').notNull().references(() => cursos.id),
  periodoId: integer('periodo_id').references(() => periodos.id),
  anoIngresso: integer('ano_ingresso').notNull(),
  igreja: varchar('igreja', { length: 120 }),
  situacao: situacaoAlunoEnum('situacao').notNull().default('ATIVO'),
  coeficienteAcad: decimal('coeficiente_acad', { precision: 4, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Aluno = typeof alunos.$inferSelect;
export type NewAluno = typeof alunos.$inferInsert; 