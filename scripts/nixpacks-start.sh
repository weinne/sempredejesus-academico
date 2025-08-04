#!/bin/bash
set -e

echo "🚀 Starting application with Nixpacks..."

# Function to wait for database
wait_for_database() {
    echo "⏳ Waiting for database connection..."
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL not set!"
        exit 1
    fi
    
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        # Simple connection test using node
        if node -e "
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
        " 2>/dev/null; then
            echo "✅ Database is ready!"
            return 0
        fi
        
        echo "Database not ready, waiting... ($((count + 1))/$retries)"
        sleep 3
        count=$((count + 1))
    done
    
    echo "❌ Database connection timeout after $retries attempts"
    exit 1
}

# Run database operations  
run_migrations() {
    echo "🔄 Running database migrations..."
    
    cd apps/api
    
    # Check if migration script exists
    if [ ! -f "dist/scripts/migrate-production.js" ]; then
        echo "❌ Migration script not found! Trying to push schema instead..."
        if command -v pnpm &> /dev/null; then
            pnpm run db:push
        else
            npm run db:push
        fi
    else
        # Run migrations using the production script
        if command -v pnpm &> /dev/null; then
            pnpm run migrate:prod
        else
            npm run migrate:prod
        fi
    fi
    
    echo "✅ Database setup completed!"
    cd ../..
}

# Check if server file exists
check_server() {
    if [ ! -f "apps/api/dist/server.js" ]; then
        echo "❌ Server file not found at apps/api/dist/server.js"
        echo "🔍 Available files:"
        ls -la apps/api/dist/ || echo "No dist directory found"
        exit 1
    fi
}

# Main execution
main() {
    echo "🔍 Checking environment..."
    echo "NODE_ENV: $NODE_ENV"
    echo "PORT: $PORT"
    echo "DATABASE_URL: ${DATABASE_URL:0:30}..." # Show only first 30 chars for security
    
    wait_for_database
    run_migrations
    check_server
    
    echo "🚀 Starting API server..."
    cd apps/api
    exec node dist/server.js
}

# Handle signals gracefully
cleanup() {
    echo "🛑 Received shutdown signal, cleaning up..."
    exit 0
}

trap cleanup SIGTERM SIGINT

# Run main function
main "$@"
