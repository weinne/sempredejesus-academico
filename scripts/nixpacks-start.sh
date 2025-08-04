#!/bin/bash
set -e

echo "🚀 Starting application with Nixpacks..."

# Function to wait for database
wait_for_database() {
    echo "⏳ Waiting for database connection..."
    
    # Install postgres client if not available
    if ! command -v pg_isready &> /dev/null; then
        echo "📦 Installing PostgreSQL client..."
        apt-get update && apt-get install -y postgresql-client
    fi
    
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        if pg_isready -d "$DATABASE_URL" 2>/dev/null; then
            echo "✅ Database is ready!"
            return 0
        fi
        
        echo "Database not ready, waiting... ($((count + 1))/$retries)"
        sleep 2
        count=$((count + 1))
    done
    
    echo "❌ Database connection timeout"
    exit 1
}

# Run database operations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    cd apps/api
    
    # Run migrations using the production script
    if command -v pnpm &> /dev/null; then
        pnpm run migrate:prod
    else
        npm run migrate:prod
    fi
    
    echo "✅ Database migrations completed!"
    cd ../..
}

# Main execution
main() {
    wait_for_database
    run_migrations
    
    echo "🚀 Starting API server..."
    cd apps/api
    exec node dist/server.js
}

# Handle signals
trap 'echo "Received signal, shutting down..."; exit 0' SIGTERM SIGINT

main "$@"
