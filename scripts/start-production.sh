#!/bin/bash
set -e

echo "🚀 Initializing production deployment..."

# Navigate to API directory
cd apps/api

# Function to wait for database
wait_for_db() {
  local retries=30
  local count=0
  
  echo "⏳ Waiting for database connection..."
  
  while [ $count -lt $retries ]; do
    if node -e "
      const postgres = require('postgres');
      const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 5 });
      sql\`SELECT 1\`.then(() => {
        console.log('Database connected');
        process.exit(0);
      }).catch(() => {
        process.exit(1);
      });
    " 2>/dev/null; then
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

# Wait for database to be ready
wait_for_db

# Run migrations
echo "🔄 Running database migrations..."
if command -v pnpm &> /dev/null; then
    pnpm run migrate:prod
else
    npm run migrate:prod
fi

echo "✅ Migrations completed!"

# Return to root
cd ../..

# Start the application
echo "🚀 Starting application..."
exec node apps/api/dist/server.js
