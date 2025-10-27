-- Migration: Add hora_inicio and hora_fim to aulas table
-- Created: 2025-10-27

ALTER TABLE aulas ADD COLUMN hora_inicio TIME;
ALTER TABLE aulas ADD COLUMN hora_fim TIME;

