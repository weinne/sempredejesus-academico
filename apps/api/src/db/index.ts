import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config, logger } from '@seminario/shared-config';
import * as schema from './schema';

// Create the database connection
const queryClient = postgres(config.database.url, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema, logger: false });

// Test connection
export async function testConnection() {
  try {
    await queryClient`SELECT 1`;
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection() {
  try {
    await queryClient.end();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
} 