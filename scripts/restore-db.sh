#!/bin/bash

# PostgreSQL Restore Script - Sistema Acadêmico
# Disaster recovery restore from backup

set -e

# Configuration
BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-seminario_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Validate arguments
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /var/backups/postgresql/seminario_db_backup_20241207_120000.sql.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "[$(date)] Starting database restore..."
echo "[$(date)] Backup file: $BACKUP_FILE"
echo "[$(date)] Target database: $DB_NAME"

# Confirm restore
read -p "⚠️  WARNING: This will REPLACE all data in database '$DB_NAME'. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled by user"
    exit 0
fi

# Create temporary file for decompressed backup
TEMP_FILE="/tmp/restore_$(date +%s).sql"

# Decompress backup if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "[$(date)] Decompressing backup..."
    if gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"; then
        echo "[$(date)] Backup decompressed to: $TEMP_FILE"
        RESTORE_FILE="$TEMP_FILE"
    else
        echo "[$(date)] Error: Failed to decompress backup"
        exit 1
    fi
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Drop existing database (with confirmation)
echo "[$(date)] Dropping existing database..."
if dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null; then
    echo "[$(date)] Database '$DB_NAME' dropped"
else
    echo "[$(date)] Warning: Database may not exist or failed to drop"
fi

# Create new database
echo "[$(date)] Creating new database..."
if createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"; then
    echo "[$(date)] Database '$DB_NAME' created"
else
    echo "[$(date)] Error: Failed to create database"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Restore data
echo "[$(date)] Restoring data..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$RESTORE_FILE"; then
    echo "[$(date)] Database restore completed successfully!"
    
    # Cleanup
    rm -f "$TEMP_FILE"
    
    echo "[$(date)] Database '$DB_NAME' has been restored from: $BACKUP_FILE"
    exit 0
else
    echo "[$(date)] Error: Failed to restore database"
    rm -f "$TEMP_FILE"
    exit 1
fi 