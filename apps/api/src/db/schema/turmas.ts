import { pgTable, serial, integer, char, varchar, decimal, pgEnum, text, date, time } from 'drizzle-orm/pg-core';
import { disciplinas } from './disciplinas';
import { professores } from './professores';
import { alunos } from './alunos';
import { coortes } from './coortes';
import { periodos } from './periodos';

export const turmas = pgTable('turmas', {
  id: serial('id').primaryKey(),
  disciplinaId: integer('disciplina_id').notNull().references(() => disciplinas.id, { onDelete: 'cascade' }),
  professorId: char('professor_id', { length: 8 })
    .notNull()
    .references(() => professores.matricula, { onDelete: 'cascade' }),
  sala: varchar('sala', { length: 20 }),
  // horario removido, substitui-se por diaSemana, inicio e fim
  diaSemana: integer('dia_semana'), // 0=Dom, 1=Seg, ..., 6=Sab
  horarioInicio: time('horario_inicio'),
  horarioFim: time('horario_fim'),
  dataInicio: date('data_inicio'),
  dataFim: date('data_fim'),
  secao: varchar('secao', { length: 6 }),
  coorteId: integer('coorte_id').references(() => coortes.id, { onDelete: 'cascade' }),
  periodoId: integer('periodo_id').references(() => periodos.id, { onDelete: 'set null' }),
  ementa: text('ementa'),
  bibliografia: text('bibliografia'),
  objetivos: text('objetivos'),
  conteudoProgramatico: text('conteudo_programatico'),
  instrumentosEAvaliacao: text('instrumentos_e_avaliacao'),
});

export const statusInscricaoEnum = pgEnum('status_inscricao', ['MATRICULADO', 'CANCELADO', 'APROVADO', 'REPROVADO']);

export const turmasInscritos = pgTable('turmas_inscritos', {
  id: serial('id').primaryKey(),
  turmaId: integer('turma_id')
    .notNull()
    .references(() => turmas.id, { onDelete: 'cascade' }),
  alunoId: char('aluno_id', { length: 8 })
    .notNull()
    .references(() => alunos.ra, { onDelete: 'cascade' }),
  media: decimal('media', { precision: 4, scale: 1 }),
  frequencia: decimal('frequencia', { precision: 5, scale: 2 }),
  status: statusInscricaoEnum('status').notNull().default('MATRICULADO'),
});

export type Turma = typeof turmas.$inferSelect;
export type NewTurma = typeof turmas.$inferInsert;
export type TurmaInscrito = typeof turmasInscritos.$inferSelect;
export type NewTurmaInscrito = typeof turmasInscritos.$inferInsert; 