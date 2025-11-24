#!/bin/bash
# Script para iniciar containers manualmente quando o devcontainer CLI falha
# Use quando receber erro "Command failed: docker compose ... up -d"

set -e

echo "🚀 Iniciando containers manualmente..."

# Limpar containers antigos
echo "🧹 Limpando containers antigos..."
docker compose -f .devcontainer/docker-compose.yml down 2>/dev/null || true
docker rm -f seminario_dev seminario_db_dev seminario_adminer 2>/dev/null || true

# Iniciar containers
echo "📦 Iniciando containers..."
docker compose -f .devcontainer/docker-compose.yml up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 5

# Verificar status
echo ""
echo "📊 Status dos containers:"
docker compose -f .devcontainer/docker-compose.yml ps

echo ""
echo "✅ Containers iniciados!"
echo ""
echo "💡 Próximos passos:"
echo "   1. No VS Code/Cursor: F1 → Dev Containers: Attach to Running Container"
echo "   2. Selecione: seminario_dev"
echo ""
echo "   Ou aguarde alguns segundos e tente:"
echo "   F1 → Dev Containers: Reopen in Container"

