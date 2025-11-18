import { defineConfig } from 'drizzle-kit';
import dotenvFlow from 'dotenv-flow';
import { resolve } from 'path';

// Load environment variables from project root
dotenvFlow.config({ 
  silent: true,
  path: resolve(__dirname, '../..'),
});

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:passwd@localhost:5432/seminario_db',
  },
  verbose: true,
  strict: false,
});