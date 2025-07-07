import type { Config } from 'drizzle-kit';
import { config } from '@seminario/shared-config';

export default {
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: config.database.url,
  },
  verbose: true,
  strict: false, // Remove prompts interativos
} satisfies Config; 