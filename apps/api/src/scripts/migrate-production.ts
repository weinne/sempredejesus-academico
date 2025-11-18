import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config, logger } from '@seminario/shared-config';
import { join } from 'path';

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Validate DATABASE_URL
    if (!config.database.url) {
      throw new Error('DATABASE_URL is not configured');
    }
    
    console.log('📡 Connecting to database...');
    
    // Create connection for migrations
    const migrationClient = postgres(config.database.url, { 
      max: 1,
      connect_timeout: 10,
      idle_timeout: 20,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });
    
    const db = drizzle(migrationClient);
    
    // Test connection first
    console.log('🔍 Testing database connection...');
    await migrationClient`SELECT 1`;
    console.log('✅ Database connection successful!');
    
    // Get migrations folder path
    const migrationsFolder = join(__dirname, '../db/migrations');
    
    console.log(`📁 Using migrations folder: ${migrationsFolder}`);
    
    // Check if migrations folder exists
    const fs = await import('fs');
    if (!fs.existsSync(migrationsFolder)) {
      console.log('⚠️ Migrations folder not found, using db:push instead...');
      
      // Close connection
      await migrationClient.end();
      
      // Use drizzle-kit push instead
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('npx drizzle-kit push');
      console.log('✅ Database schema pushed successfully!');
      
      process.exit(0);
    }
    
    // Run migrations
    console.log('🔄 Applying migrations...');
    await migrate(db, { migrationsFolder });
    
    console.log('✅ Database migrations completed successfully!');
    
    // Close connection
    await migrationClient.end();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('🛑 Migration process interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('🛑 Migration process terminated');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception in migration:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection in migration:', reason);
  process.exit(1);
});

runMigrations();
