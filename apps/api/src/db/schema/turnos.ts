import { pgTable, serial, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

export const turnos = pgTable(
  'turnos',
  {
    id: serial('id').primaryKey(),
    nome: varchar('nome', { length: 30 }).notNull(), // Ex.: Diurno, Vespertino, Noturno
  },
  (table) => ({
    turnoNomeUnique: uniqueIndex('turnos_nome_unique').on(table.nome),
  })
);

export type Turno = typeof turnos.$inferSelect;
export type NewTurno = typeof turnos.$inferInsert;


