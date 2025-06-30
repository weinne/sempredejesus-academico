import { pgTable, serial, integer, char, varchar, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { disciplinas } from './disciplinas';
import { professores } from './professores';
import { semestres } from './semestres';
import { alunos } from './alunos';

export const turmas = pgTable('turmas', {
  id: serial('id').primaryKey(),
  disciplinaId: integer('disciplina_id').notNull().references(() => disciplinas.id),
  professorId: char('professor_id', { length: 8 }).notNull().references(() => professores.matricula),
  semestreId: integer('semestre_id').notNull().references(() => semestres.id),
  sala: varchar('sala', { length: 20 }),
  horario: varchar('horario', { length: 50 }),
  secao: varchar('secao', { length: 6 }),
});

export const statusInscricaoEnum = pgEnum('status_inscricao', ['MATRICULADO', 'CANCELADO', 'APROVADO', 'REPROVADO']);

export const turmasInscritos = pgTable('turmas_inscritos', {
  id: serial('id').primaryKey(),
  turmaId: integer('turma_id').notNull().references(() => turmas.id),
  alunoId: char('aluno_id', { length: 8 }).notNull().references(() => alunos.ra),
  media: decimal('media', { precision: 4, scale: 1 }),
  frequencia: decimal('frequencia', { precision: 5, scale: 2 }),
  status: statusInscricaoEnum('status').notNull().default('MATRICULADO'),
});

export type Turma = typeof turmas.$inferSelect;
export type NewTurma = typeof turmas.$inferInsert;
export type TurmaInscrito = typeof turmasInscritos.$inferSelect;
export type NewTurmaInscrito = typeof turmasInscritos.$inferInsert; 