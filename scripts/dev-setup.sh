#!/bin/bash
# Script de configuração automática do ambiente de desenvolvimento
# Este script configura o banco de dados após o Docker estar rodando

set -e

echo "🚀 Configurando ambiente de desenvolvimento..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se o Docker está rodando
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

# Verificar se o container do banco está rodando
if ! docker ps | grep -q seminario_db_dev; then
    echo "📦 Iniciando container do PostgreSQL..."
    docker compose -f docker-compose.dev.yml up -d db
    
    echo "⏳ Aguardando PostgreSQL estar pronto..."
    timeout=60
    counter=0
    while ! docker exec seminario_db_dev pg_isready -U postgres > /dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            echo "❌ Timeout aguardando PostgreSQL ficar pronto"
            exit 1
        fi
        echo -n "."
    done
    echo ""
    echo -e "${GREEN}✅ PostgreSQL está pronto!${NC}"
else
    echo -e "${GREEN}✅ Container PostgreSQL já está rodando${NC}"
fi

# Verificar se o schema já foi aplicado
echo ""
echo "🔍 Verificando se o schema já foi aplicado..."
if docker exec seminario_db_dev psql -U postgres -d seminario_db -c "\dt" 2>/dev/null | grep -q "pessoas"; then
    echo -e "${YELLOW}⚠️  Schema já existe no banco de dados${NC}"
    read -p "Deseja reaplicar o schema? (s/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Pulando aplicação do schema..."
        SKIP_SCHEMA=true
    fi
fi

# Aplicar schema se necessário
if [ "$SKIP_SCHEMA" != "true" ]; then
    echo ""
    echo "📊 Aplicando schema do banco de dados..."
    cd apps/api
    pnpm run db:push
    cd ../..
    echo -e "${GREEN}✅ Schema aplicado com sucesso!${NC}"
fi

# Informações finais
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Ambiente de desenvolvimento configurado!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 Informações de conexão:"
echo "   Host: localhost"
echo "   Porta: 5432"
echo "   Database: seminario_db"
echo "   Usuário: postgres"
echo "   Senha: passwd"
echo ""
echo "🔗 URLs úteis:"
echo "   Adminer (GUI): http://localhost:8080"
echo "   pgAdmin (GUI avançado): http://localhost:5050 (use --profile tools)"
echo ""
echo "📝 Próximos passos:"
echo "   1. Configure as variáveis de ambiente no arquivo .env"
echo "   2. Execute: pnpm dev"
echo "   3. Os usuários de teste serão criados automaticamente em desenvolvimento"
echo ""
echo -e "${YELLOW}💡 Dica: Use 'docker compose -f docker-compose.dev.yml logs -f db' para ver logs do PostgreSQL${NC}"
echo ""

