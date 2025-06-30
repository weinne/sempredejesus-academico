import type { Config } from 'drizzle-kit';
import { config } from '@seminario/shared-config';

export default {
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: config.database.url,
  },
  verbose: true,
  strict: true,
} satisfies Config; 