#!/usr/bin/env node

const { spawn } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const path = require('path');
const { exit } = require('process');

console.log('🚀 Starting application with Node.js...');

// Function to wait for database
async function waitForDatabase() {
    console.log('⏳ Waiting for database connection...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.log('❌ DATABASE_URL not set!');
        process.exit(1);
    }
    
    const retries = 30;
    let count = 0;
    
    while (count < retries) {
        try {
            // Test database connection using node
            const testConnection = spawn('node', ['-e', `
                const postgres = require('postgres');
                const sql = postgres(process.env.DATABASE_URL, { 
                    max: 1, 
                    connect_timeout: 5,
                    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
                });
                sql\`SELECT 1\`.then(() => {
                    console.log('✅ Database connected!');
                    process.exit(0);
                }).catch((err) => {
                    console.log('Database not ready:', err.message);
                    process.exit(1);
                });
            `], { 
                cwd: path.join(__dirname, '..', 'apps', 'api'),
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            const result = await new Promise((resolve) => {
                testConnection.on('close', (code) => {
                    resolve(code === 0);
                });
            });
            
            if (result) {
                console.log('✅ Database is ready!');
                return;
            }
        } catch (error) {
            // Continue to retry
        }
        
        console.log(`Database not ready, waiting... (${count + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        count++;
    }
    
    console.log(`❌ Database connection timeout after ${retries} attempts`);
    process.exit(1);
}

// Run database operations  
async function runMigrations() {
    console.log('🔄 Running database migrations...');
    
    const apiDir = path.join(__dirname, '..', 'apps', 'api');
    const migrationScript = path.join(apiDir, 'dist', 'scripts', 'migrate-production.js');
    
    // Check if migration script exists
    if (!existsSync(migrationScript)) {
        console.log('❌ Migration script not found! Trying to push schema instead...');
        
        const pushResult = await runCommand('pnpm', ['run', 'db:push'], apiDir);
        if (!pushResult) {
            console.log('❌ Failed to push database schema');
            process.exit(1);
        }
    } else {
        // Run migrations using the production script
        const migrateResult = await runCommand('pnpm', ['run', 'migrate:prod'], apiDir);
        if (!migrateResult) {
            console.log('❌ Failed to run migrations');
            process.exit(1);
        }
    }
    
    console.log('✅ Database setup completed!');
}

// Check if server file exists
function checkServer() {
    const serverPath = path.join(__dirname, '..', 'apps', 'api', 'dist', 'server.js');
    
    if (!existsSync(serverPath)) {
        console.log('❌ Server file not found at apps/api/dist/server.js');
        
        const distDir = path.join(__dirname, '..', 'apps', 'api', 'dist');
        if (existsSync(distDir)) {
            console.log('🔍 Available files:');
            try {
                const files = require('fs').readdirSync(distDir);
                files.forEach(file => console.log(`  ${file}`));
            } catch (error) {
                console.log('  Error reading directory');
            }
        } else {
            console.log('  No dist directory found');
        }
        
        process.exit(1);
    }
}

// Helper function to run commands
function runCommand(command, args, cwd) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { 
            cwd,
            stdio: 'inherit',
            env: process.env
        });
        
        proc.on('close', (code) => {
            resolve(code === 0);
        });
        
        proc.on('error', (error) => {
            console.log(`Error running ${command}:`, error.message);
            resolve(false);
        });
    });
}

// Main execution
async function main() {
    try {
        console.log('🔍 Checking environment...');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('PORT:', process.env.PORT);
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'not set');
        
        await waitForDatabase();
        await runMigrations();
        checkServer();
        
        console.log('🚀 Starting API server...');
        
        // Start the server
        const serverPath = path.join(__dirname, '..', 'apps', 'api', 'dist', 'server.js');
        const serverProcess = spawn('node', [serverPath], {
            cwd: path.join(__dirname, '..', 'apps', 'api'),
            stdio: 'inherit',
            env: process.env
        });
        
        // Handle server process exit
        serverProcess.on('close', (code) => {
            console.log(`Server exited with code ${code}`);
            process.exit(code);
        });
        
        serverProcess.on('error', (error) => {
            console.log('Server error:', error.message);
            process.exit(1);
        });
        
        // Store reference for cleanup
        process.serverProcess = serverProcess;
        
    } catch (error) {
        console.log('❌ Error in main execution:', error.message);
        process.exit(1);
    }
}

// Handle signals gracefully
function cleanup(signal) {
    console.log(`🛑 Received ${signal} signal, cleaning up...`);
    
    if (process.serverProcess) {
        process.serverProcess.kill('SIGTERM');
        setTimeout(() => {
            process.serverProcess.kill('SIGKILL');
        }, 5000);
    }
    
    process.exit(0);
}

process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGINT', () => cleanup('SIGINT'));

// Run main function
main().catch((error) => {
    console.log('❌ Unhandled error:', error.message);
    process.exit(1);
});