import { pgTable, serial, varchar, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';

export type HorarioTurno = {
  id: string;
  ordem: number;
  descricao?: string | null;
  horaInicio: string;
  horaFim: string;
};

export const turnos = pgTable(
  'turnos',
  {
    id: serial('id').primaryKey(),
    nome: varchar('nome', { length: 30 }).notNull(), // Ex.: Diurno, Vespertino, Noturno
    horarios: jsonb('horarios').$type<HorarioTurno[]>().notNull().default([]),
  },
  (table) => ({
    turnoNomeUnique: uniqueIndex('turnos_nome_unique').on(table.nome),
  })
);

export type Turno = typeof turnos.$inferSelect;
export type NewTurno = typeof turnos.$inferInsert;


