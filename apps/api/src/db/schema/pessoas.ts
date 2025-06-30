import { pgTable, serial, varchar, char, date, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const pessoas = pgTable('pessoas', {
  id: serial('id').primaryKey(),
  nomeCompleto: varchar('nome_completo', { length: 120 }).notNull(),
  sexo: char('sexo', { length: 1 }).notNull(), // CHECK constraint será adicionada via SQL
  email: varchar('email', { length: 120 }).unique(),
  cpf: char('cpf', { length: 11 }).unique(),
  dataNasc: date('data_nasc'),
  telefone: varchar('telefone', { length: 20 }),
  endereco: jsonb('endereco'), // { logradouro, numero, complemento, bairro, cidade, estado, cep }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Pessoa = typeof pessoas.$inferSelect;
export type NewPessoa = typeof pessoas.$inferInsert; 