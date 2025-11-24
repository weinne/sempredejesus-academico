#!/bin/bash
# Script para limpar containers e volumes do devcontainer
# Use antes de fazer rebuild do container

set -e

echo "🧹 Limpando containers e volumes do devcontainer..."

# Parar e remover containers
echo "📦 Parando containers..."
docker compose -f .devcontainer/docker-compose.yml down 2>/dev/null || true

# Remover containers manualmente se ainda existirem
echo "🗑️  Removendo containers antigos..."
docker rm -f seminario_dev seminario_db_dev seminario_adminer 2>/dev/null || true

# Remover containers do projeto devcontainer (com prefixo)
echo "🗑️  Removendo containers do projeto devcontainer..."
docker ps -a --filter "name=sempredejesus-academico_devcontainer" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true

# Remover imagens antigas (opcional)
echo "🗑️  Removendo imagens antigas..."
docker rmi sempredejesus-academico_devcontainer-dev 2>/dev/null || true
docker rmi devcontainer-dev 2>/dev/null || true

# Remover volumes (opcional - descomente se quiser limpar dados do banco)
# echo "🗑️  Removendo volumes..."
# docker volume rm devcontainer_postgres_dev_data devcontainer_node_modules devcontainer_api_node_modules devcontainer_portal_node_modules 2>/dev/null || true

# Limpar redes órfãs
echo "🧹 Limpando redes órfãs..."
docker network prune -f 2>/dev/null || true

echo "✅ Limpeza concluída!"
echo ""
echo "💡 Agora você pode abrir o container novamente:"
echo "   F1 → Dev Containers: Reopen in Container"
echo ""
echo "   Ou fazer rebuild completo:"
echo "   F1 → Dev Containers: Rebuild Container"

