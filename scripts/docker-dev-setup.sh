#!/bin/bash
# Script completo de setup do ambiente de desenvolvimento com Docker
# Este script configura tudo automaticamente: Docker, PostgreSQL, Schema e Usuários

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 Setup Completo do Ambiente de Desenvolvimento${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar pré-requisitos
echo -e "${BLUE}📋 Verificando pré-requisitos...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker não está instalado.${NC}"
    echo "   Por favor, instale o Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if ! command_exists pnpm; then
    echo -e "${RED}❌ pnpm não está instalado.${NC}"
    echo "   Instale com: npm install -g pnpm"
    exit 1
fi

echo -e "${GREEN}✅ Pré-requisitos verificados${NC}"
echo ""

# Verificar se o Docker está rodando
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando.${NC}"
    echo "   Por favor, inicie o Docker Desktop."
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo "   Criando arquivo .env a partir do template..."
    
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:passwd@localhost:5432/seminario_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-change-in-production"

# Server
PORT=4000
NODE_ENV="development"
APP_URL="http://localhost:3001"
API_URL="http://localhost:4000"

# Upload
UPLOAD_MAX_SIZE="5mb"
UPLOAD_PATH="./uploads"

# Rate Limit
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
    echo -e "${YELLOW}💡 Revise o arquivo .env e ajuste as configurações se necessário${NC}"
    echo ""
fi

# Iniciar PostgreSQL
echo -e "${BLUE}📦 Configurando PostgreSQL...${NC}"

# Verificar se o container já está rodando
if docker ps --format "{{.Names}}" | grep -q "^seminario_db_dev$"; then
    echo -e "${GREEN}✅ Container PostgreSQL já está rodando${NC}"
else
    echo "   Iniciando container PostgreSQL..."
    docker compose -f docker-compose.dev.yml up -d db
    
    echo -e "${YELLOW}⏳ Aguardando PostgreSQL estar pronto...${NC}"
    timeout=60
    counter=0
    while ! docker exec seminario_db_dev pg_isready -U postgres -d seminario_db > /dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            echo ""
            echo -e "${RED}❌ Timeout aguardando PostgreSQL ficar pronto${NC}"
            exit 1
        fi
        echo -n "."
    done
    echo ""
    echo -e "${GREEN}✅ PostgreSQL está pronto!${NC}"
fi

# Instalar dependências
echo ""
echo -e "${BLUE}📦 Instalando dependências...${NC}"
pnpm install
echo -e "${GREEN}✅ Dependências instaladas${NC}"

# Verificar se o schema já foi aplicado
echo ""
echo -e "${BLUE}🔍 Verificando schema do banco de dados...${NC}"

SCHEMA_EXISTS=false
if docker exec seminario_db_dev psql -U postgres -d seminario_db -t -c "\dt" 2>/dev/null | grep -q "pessoas"; then
    SCHEMA_EXISTS=true
fi

if [ "$SCHEMA_EXISTS" = true ]; then
    echo -e "${YELLOW}⚠️  Schema já existe no banco de dados${NC}"
    read -p "   Deseja reaplicar o schema? (s/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}   Pulando aplicação do schema...${NC}"
        SKIP_SCHEMA=true
    fi
fi

# Aplicar schema se necessário
if [ "$SKIP_SCHEMA" != "true" ]; then
    echo ""
    echo -e "${BLUE}📊 Aplicando schema do banco de dados...${NC}"
    cd apps/api
    pnpm run db:push
    cd ../..
    echo -e "${GREEN}✅ Schema aplicado com sucesso!${NC}"
fi

# Informações finais
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Ambiente de desenvolvimento configurado com sucesso!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Informações de Conexão:${NC}"
echo "   Host: localhost"
echo "   Porta: 5432"
echo "   Database: seminario_db"
echo "   Usuário: postgres"
echo "   Senha: passwd"
echo ""
echo -e "${BLUE}🔗 URLs Úteis:${NC}"
echo "   Portal (Frontend): http://localhost:3001"
echo "   API: http://localhost:4000"
echo "   API Docs: http://localhost:4000/docs"
echo "   Adminer (GUI DB): http://localhost:8080 (use --profile tools)"
echo "   pgAdmin (GUI DB): http://localhost:5050 (use --profile tools)"
echo ""
echo -e "${BLUE}📝 Próximos Passos:${NC}"
echo "   1. Execute: ${GREEN}pnpm dev${NC}"
echo "   2. Os usuários de teste serão criados automaticamente"
echo "   3. Acesse o portal em http://localhost:3001"
echo ""
echo -e "${YELLOW}💡 Dicas:${NC}"
echo "   - Ver logs do PostgreSQL: ${CYAN}pnpm docker:dev:logs${NC}"
echo "   - Parar containers: ${CYAN}pnpm docker:dev:down${NC}"
echo "   - Iniciar ferramentas (Adminer/pgAdmin): ${CYAN}pnpm docker:dev:tools${NC}"
echo "   - Drizzle Studio: ${CYAN}pnpm db:studio${NC}"
echo ""

