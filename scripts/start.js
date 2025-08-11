#!/usr/bin/env node

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('🚀 Starting application...');

// Function to wait for database connection
async function waitForDatabase() {
    console.log('⏳ Waiting for database connection...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not set!');
        process.exit(1);
    }
    
    const retries = 30;
    
    for (let count = 0; count < retries; count++) {
        try {
            // Use dynamic import for postgres (ES module)
            const postgres = await import('postgres');
            const sql = postgres.default(process.env.DATABASE_URL, { 
                max: 1, 
                connect_timeout: 5,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
            });
            
            await sql`SELECT 1`;
            console.log('✅ Database is ready!');
            await sql.end();
            return;
        } catch (err) {
            console.log(`Database not ready, waiting... (${count + 1}/${retries}) - ${err.message}`);
            if (count < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
    
    console.error(`❌ Database connection timeout after ${retries} attempts`);
    process.exit(1);
}

// Function to run database migrations
async function runMigrations() {
    console.log('🔄 Running database migrations...');
    
    const apiDir = path.join(process.cwd(), 'apps', 'api');
    
    return new Promise((resolve, reject) => {
        // Try migrate:prod first
        const migrateProcess = spawn('pnpm', ['run', 'migrate:prod'], {
            cwd: apiDir,
            stdio: 'inherit'
        });
        
        migrateProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Database migrations completed!');
                resolve();
            } else {
                console.log('❌ Migration script failed, trying db:push as fallback...');
                
                // Fallback to db:push
                const pushProcess = spawn('pnpm', ['run', 'db:push'], {
                    cwd: apiDir,
                    stdio: 'inherit'
                });
                
                pushProcess.on('close', (pushCode) => {
                    if (pushCode === 0) {
                        console.log('✅ Database schema push completed!');
                        resolve();
                    } else {
                        reject(new Error('Both migrate:prod and db:push failed'));
                    }
                });
                
                pushProcess.on('error', (err) => {
                    reject(new Error(`db:push process error: ${err.message}`));
                });
            }
        });
        
        migrateProcess.on('error', (err) => {
            reject(new Error(`migrate:prod process error: ${err.message}`));
        });
    });
}

// Function to check if server file exists
function checkServer() {
    const serverPath = path.join(process.cwd(), 'apps', 'api', 'dist', 'server.js');
    
    if (!existsSync(serverPath)) {
        console.error('❌ Server file not found at apps/api/dist/server.js');
        
        // Check if dist directory exists at all
        const distPath = path.join(process.cwd(), 'apps', 'api', 'dist');
        if (existsSync(distPath)) {
            console.error('🔍 Available files in dist:');
            try {
                const fs = require('fs');
                const files = fs.readdirSync(distPath);
                console.error(files.join('\n'));
            } catch (err) {
                console.error('Could not list dist directory contents');
            }
        } else {
            console.error('No dist directory found');
        }
        
        process.exit(1);
    }
    
    console.log('✅ Server file found');
}

// Main execution function
async function main() {
    try {
        console.log('🔍 Checking environment...');
        console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`PORT: ${process.env.PORT}`);
        console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'not set'}`);
        
        await waitForDatabase();
        await runMigrations();
        checkServer();
        
        console.log('🚀 Starting API server...');
        
        const apiDir = path.join(process.cwd(), 'apps', 'api');
        const serverProcess = spawn('node', ['dist/server.js'], {
            cwd: apiDir,
            stdio: 'inherit'
        });
        
        // Handle graceful shutdown
        const cleanup = () => {
            console.log('🛑 Received shutdown signal, cleaning up...');
            serverProcess.kill('SIGTERM');
            process.exit(0);
        };
        
        process.on('SIGTERM', cleanup);
        process.on('SIGINT', cleanup);
        
        serverProcess.on('close', (code) => {
            console.log(`Server process exited with code ${code}`);
            process.exit(code);
        });
        
        serverProcess.on('error', (err) => {
            console.error(`Server process error: ${err.message}`);
            process.exit(1);
        });
        
    } catch (error) {
        console.error(`❌ Startup failed: ${error.message}`);
        process.exit(1);
    }
}

// Run main function
main().catch((error) => {
    console.error(`❌ Unhandled error: ${error.message}`);
    process.exit(1);
});