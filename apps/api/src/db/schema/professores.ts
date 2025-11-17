import { pgTable, char, integer, date, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { pessoas } from './pessoas';

export const situacaoProfessorEnum = pgEnum('situacao_professor', ['ATIVO', 'INATIVO']);

export const professores = pgTable('professores', {
  matricula: char('matricula', { length: 8 }).primaryKey(),
  pessoaId: integer('pessoa_id')
    .notNull()
    .references(() => pessoas.id, { onDelete: 'cascade' }),
  dataInicio: date('data_inicio').notNull(),
  formacaoAcad: varchar('formacao_acad', { length: 120 }),
  situacao: situacaoProfessorEnum('situacao').notNull().default('ATIVO'),
});

export type Professor = typeof professores.$inferSelect;
export type NewProfessor = typeof professores.$inferInsert; 