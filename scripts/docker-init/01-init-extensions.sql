-- Script de inicialização do PostgreSQL para desenvolvimento
-- Este script é executado automaticamente quando o container é criado pela primeira vez

-- Habilitar extensões úteis para desenvolvimento
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca de texto (LIKE com índice)

-- Configurações de performance para desenvolvimento
ALTER DATABASE seminario_db SET timezone TO 'America/Sao_Paulo';
ALTER DATABASE seminario_db SET lc_messages TO 'pt_BR.UTF-8';

-- Log de queries em desenvolvimento (útil para debug)
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = 'on';
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Configurações de memória para desenvolvimento
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET work_mem = '16MB';

-- Configurações de conexão
ALTER SYSTEM SET max_connections = '200';

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Extensões e configurações do PostgreSQL aplicadas com sucesso!';
END $$;

