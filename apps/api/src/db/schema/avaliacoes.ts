import { pgTable, serial, integer, date, varchar, smallint, text, decimal, char, pgEnum } from 'drizzle-orm/pg-core';
import { turmas } from './turmas';
import { alunos } from './alunos';

export const tipoAvaliacaoEnum = pgEnum('tipo_avaliacao', ['PROVA', 'TRABALHO', 'PARTICIPACAO', 'OUTRO']);

export const avaliacoes = pgTable('avaliacoes', {
  id: serial('id').primaryKey(),
  turmaId: integer('turma_id').notNull().references(() => turmas.id),
  data: date('data').notNull(),
  tipo: tipoAvaliacaoEnum('tipo').notNull(),
  codigo: varchar('codigo', { length: 8 }).notNull(),
  descricao: varchar('descricao', { length: 50 }).notNull(),
  peso: smallint('peso').notNull(),
  arquivoUrl: text('arquivo_url'),
});

export const avaliacoesAlunos = pgTable('avaliacoes_alunos', {
  id: serial('id').primaryKey(),
  avaliacaoId: integer('avaliacao_id').notNull().references(() => avaliacoes.id),
  alunoId: char('aluno_id', { length: 8 }).notNull().references(() => alunos.ra),
  nota: decimal('nota', { precision: 5, scale: 2 }).notNull(),
  obs: text('obs'),
});

export type Avaliacao = typeof avaliacoes.$inferSelect;
export type NewAvaliacao = typeof avaliacoes.$inferInsert;
export type AvaliacaoAluno = typeof avaliacoesAlunos.$inferSelect;
export type NewAvaliacaoAluno = typeof avaliacoesAlunos.$inferInsert; 