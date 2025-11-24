#!/bin/bash
# Script executado antes de iniciar os containers
# Este script limpa containers antigos que podem causar conflitos

echo "🧹 Limpando containers antigos..."

# Parar containers existentes
docker compose -f .devcontainer/docker-compose.yml down 2>/dev/null || true

# Remover containers manualmente se ainda existirem
docker rm -f seminario_dev seminario_db_dev seminario_adminer 2>/dev/null || true

echo "✅ Limpeza concluída"

