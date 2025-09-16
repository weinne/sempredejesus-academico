import { pgTable, serial, integer, varchar, text, timestamp, decimal } from 'drizzle-orm/pg-core';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'avaliacao_aluno', 'frequencia', etc
  entityId: integer('entity_id').notNull(), // ID da entidade afetada
  action: varchar('action', { length: 20 }).notNull(), // 'CREATE', 'UPDATE', 'DELETE'
  oldValues: text('old_values'), // JSON com valores anteriores
  newValues: text('new_values'), // JSON com novos valores
  metadata: text('metadata'), // Informações extras (turma, aluno, etc)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;