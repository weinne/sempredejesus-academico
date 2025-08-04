#!/bin/bash
set -e

echo "🚀 Simple startup script (fallback)..."

# Basic environment check
echo "NODE_ENV: ${NODE_ENV:-not-set}"
echo "PORT: ${PORT:-not-set}"
echo "DATABASE_URL: ${DATABASE_URL:+set}"

# Navigate to API
cd apps/api

# Simple database push (no migrations)
echo "🔄 Pushing database schema..."
if command -v pnpm &> /dev/null; then
    pnpm run db:push || echo "⚠️ DB push failed, continuing..."
else
    npm run db:push || echo "⚠️ DB push failed, continuing..."
fi

# Start server
echo "🚀 Starting server..."
exec node dist/server.js
