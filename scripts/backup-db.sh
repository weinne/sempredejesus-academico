#!/bin/bash

# PostgreSQL Backup Script - Sistema Acadêmico
# Automated backup with rotation and compression

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
DB_NAME="${DB_NAME:-seminario_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
S3_BUCKET="${S3_BUCKET:-}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/seminario_db_backup_$TIMESTAMP.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

echo "[$(date)] Starting PostgreSQL backup..."

# Create database dump
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
    echo "[$(date)] Database dump created: $BACKUP_FILE"
    
    # Compress backup
    if gzip "$BACKUP_FILE"; then
        echo "[$(date)] Backup compressed: $COMPRESSED_FILE"
        
        # Upload to S3 if configured
        if [ -n "$S3_BUCKET" ] && command -v aws >/dev/null 2>&1; then
            if aws s3 cp "$COMPRESSED_FILE" "s3://$S3_BUCKET/database-backups/"; then
                echo "[$(date)] Backup uploaded to S3: s3://$S3_BUCKET/database-backups/"
            else
                echo "[$(date)] Warning: Failed to upload to S3"
            fi
        fi
        
        # Cleanup old backups
        echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..."
        find "$BACKUP_DIR" -name "seminario_db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
        
        echo "[$(date)] Backup completed successfully!"
        
        # Log backup info
        BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        echo "[$(date)] Backup size: $BACKUP_SIZE"
        
        exit 0
    else
        echo "[$(date)] Error: Failed to compress backup"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    echo "[$(date)] Error: Failed to create database dump"
    exit 1
fi 