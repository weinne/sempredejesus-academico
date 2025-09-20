import { pgTable, serial, integer, smallint, varchar, text, uniqueIndex, date } from 'drizzle-orm/pg-core';
import { cursos } from './cursos';
import { turnos } from './turnos';
import { curriculos } from './curriculos';

export const periodos = pgTable(
  'periodos',
  {
    id: serial('id').primaryKey(),
    cursoId: integer('curso_id')
      .notNull()
      .references(() => cursos.id, { onDelete: 'cascade' }),
    turnoId: integer('turno_id')
      .notNull()
      .references(() => turnos.id, { onDelete: 'restrict' }),
    curriculoId: integer('curriculo_id')
      .notNull()
      .references(() => curriculos.id, { onDelete: 'restrict' }),
    numero: smallint('numero').notNull(),
    nome: varchar('nome', { length: 80 }),
    descricao: text('descricao'),
    dataInicio: date('data_inicio'),
    dataFim: date('data_fim'),
  },
  (table) => ({
    cursoNumeroIdx: uniqueIndex('periodos_curso_numero_unique').on(table.cursoId, table.numero),
  })
);

export type Periodo = typeof periodos.$inferSelect;
export type NewPeriodo = typeof periodos.$inferInsert;
