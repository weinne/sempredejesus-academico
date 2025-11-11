import { pgTable, serial, integer, smallint, varchar, text, uniqueIndex, date } from 'drizzle-orm/pg-core';
import { curriculos } from './curriculos';

export const periodos = pgTable(
  'periodos',
  {
    id: serial('id').primaryKey(),
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
    curriculoNumeroIdx: uniqueIndex('periodos_curriculo_numero_unique').on(table.curriculoId, table.numero),
  })
);

export type Periodo = typeof periodos.$inferSelect;
export type NewPeriodo = typeof periodos.$inferInsert;
