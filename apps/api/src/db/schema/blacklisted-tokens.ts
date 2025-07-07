import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const blacklistedTokens = pgTable('blacklisted_tokens', {
  id: serial('id').primaryKey(),
  jti: varchar('jti', { length: 255 }).notNull().unique(), // JWT ID
  token: varchar('token', { length: 1000 }).notNull(), // Full token for verification
  expiresAt: timestamp('expires_at').notNull(), // When the token expires naturally
  blacklistedAt: timestamp('blacklisted_at').defaultNow().notNull(), // When it was blacklisted
});

export type BlacklistedToken = typeof blacklistedTokens.$inferSelect;
export type NewBlacklistedToken = typeof blacklistedTokens.$inferInsert; 