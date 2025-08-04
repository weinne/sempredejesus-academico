import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config, logger } from '@seminario/shared-config';
import { join } from 'path';

async function runMigrations() {
  logger.info('🚀 Starting database migrations...');
  
  try {
    // Create connection for migrations
    const migrationClient = postgres(config.database.url, { 
      max: 1,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });
    
    const db = drizzle(migrationClient);
    
    // Get migrations folder path
    const migrationsFolder = join(__dirname, '../db/migrations');
    
    logger.info(`📁 Using migrations folder: ${migrationsFolder}`);
    
    // Run migrations
    await migrate(db, { migrationsFolder });
    
    logger.info('✅ Database migrations completed successfully!');
    
    // Close connection
    await migrationClient.end();
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Migration process interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('Migration process terminated');
  process.exit(1);
});

runMigrations();
