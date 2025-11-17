import { pgTable, serial, varchar, char, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { pessoas } from './pessoas';

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  pessoaId: integer('pessoa_id')
    .notNull()
    .references(() => pessoas.id, { onDelete: 'cascade' })
    .unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  isActive: char('is_active', { length: 1 }).notNull().default('S'), // S/N
  lastLogin: timestamp('last_login'),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  refreshToken: varchar('refresh_token', { length: 500 }),
  refreshTokenExpires: timestamp('refresh_token_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert; 