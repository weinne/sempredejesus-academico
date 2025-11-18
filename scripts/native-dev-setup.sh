#!/bin/bash
# Script de configuração do ambiente de desenvolvimento nativo (Ubuntu/Xubuntu)
# Configura Node.js, pnpm, banco de dados PostgreSQL e aplica migrações

# Não usar set -e para permitir tratamento de erros de sudo
set +e

echo "🚀 Configurando ambiente de desenvolvimento nativo..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variáveis
DB_NAME="seminario_db"
DB_USER="postgres"
DB_PASSWORD="3682"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Nota: Este script assume PostgreSQL na porta padrão 5432
# Se seu PostgreSQL estiver em outra porta, atualize o .env manualmente após executar este script

# ===========================================
# 1. Verificar e instalar Node.js
# ===========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 Verificando Node.js...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✅ Node.js $(node --version) já está instalado${NC}"
    else
        echo -e "${YELLOW}⚠️  Node.js versão $(node --version) encontrada, mas precisa ser >= 18${NC}"
        echo "Instalando Node.js 18+ via nvm..."
        if ! command -v nvm &> /dev/null; then
            echo "Instalando nvm..."
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        fi
        nvm install 18
        nvm use 18
    fi
else
    echo "Instalando Node.js 18+ via nvm..."
    if ! command -v nvm &> /dev/null; then
        echo "Instalando nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    nvm install 18
    nvm use 18
    echo -e "${GREEN}✅ Node.js instalado com sucesso${NC}"
fi

# ===========================================
# 2. Verificar e instalar pnpm
# ===========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 Verificando pnpm...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version | cut -d'.' -f1)
    if [ "$PNPM_VERSION" -ge 8 ]; then
        echo -e "${GREEN}✅ pnpm $(pnpm --version) já está instalado${NC}"
    else
        echo -e "${YELLOW}⚠️  pnpm versão $(pnpm --version) encontrada, mas precisa ser >= 8${NC}"
        echo "Atualizando pnpm..."
        npm install -g pnpm@latest
    fi
else
    echo "Instalando pnpm..."
    npm install -g pnpm@latest
    echo -e "${GREEN}✅ pnpm instalado com sucesso${NC}"
fi

# ===========================================
# 3. Verificar PostgreSQL
# ===========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🗄️  Verificando PostgreSQL...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL não encontrado. Por favor, instale o PostgreSQL primeiro.${NC}"
    echo "Execute: sudo apt install postgresql postgresql-contrib"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL $(psql --version) está instalado${NC}"

# Verificar se o serviço está rodando
if ! sudo systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "Iniciando serviço PostgreSQL..."
    if sudo systemctl start postgresql 2>/dev/null; then
        sudo systemctl enable postgresql 2>/dev/null
        echo -e "${GREEN}✅ Serviço PostgreSQL iniciado${NC}"
    else
        echo -e "${YELLOW}⚠️  Não foi possível iniciar o PostgreSQL via sudo${NC}"
        echo "   Por favor, inicie manualmente: sudo systemctl start postgresql"
        read -p "Pressione Enter para continuar ou Ctrl+C para sair..."
    fi
else
    echo -e "${GREEN}✅ Serviço PostgreSQL já está rodando${NC}"
fi

# ===========================================
# 4. Criar banco de dados
# ===========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🗄️  Configurando banco de dados...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Verificar se o banco já existe
DB_EXISTS=false
if sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    DB_EXISTS=true
fi

if [ "$DB_EXISTS" = true ]; then
    echo -e "${YELLOW}⚠️  Banco de dados '$DB_NAME' já existe${NC}"
    read -p "Deseja recriar o banco? Isso apagará todos os dados! (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "Removendo banco de dados existente..."
        if sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null; then
            echo "Criando novo banco de dados..."
            if sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null; then
                echo -e "${GREEN}✅ Banco de dados criado${NC}"
            else
                echo -e "${RED}❌ Erro ao criar banco de dados${NC}"
                echo "   Execute manualmente: sudo -u postgres psql -c \"CREATE DATABASE $DB_NAME;\""
                exit 1
            fi
        else
            echo -e "${RED}❌ Erro ao remover banco de dados${NC}"
            exit 1
        fi
    else
        echo "Mantendo banco de dados existente..."
    fi
else
    echo "Criando banco de dados '$DB_NAME'..."
    if sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null; then
        echo -e "${GREEN}✅ Banco de dados criado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao criar banco de dados. Verifique:${NC}"
        echo "   1. Se você tem permissão sudo"
        echo "   2. Se a senha do PostgreSQL está correta"
        echo ""
        echo "   Execute manualmente:"
        echo "   ${YELLOW}sudo -u postgres psql -c \"CREATE DATABASE $DB_NAME;\"${NC}"
        echo ""
        read -p "Pressione Enter para continuar (você precisará criar o banco manualmente) ou Ctrl+C para sair..."
    fi
fi

# ===========================================
# 5. Criar arquivo .env
# ===========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}⚙️  Configurando variáveis de ambiente...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT"

if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env já existe${NC}"
    read -p "Deseja sobrescrever? (s/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Mantendo arquivo .env existente..."
        SKIP_ENV=true
    fi
fi

if [ "$SKIP_ENV" != "true" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Arquivo .env criado a partir de .env.example"
    else
        echo -e "${RED}❌ Arquivo .env.example não encontrado${NC}"
        exit 1
    fi

    # Atualizar DATABASE_URL com a senha correta
    sed -i "s|postgresql://postgres:passwd@localhost:5432/seminario_db|postgresql://postgres:${DB_PASSWORD}@localhost:5432/${DB_NAME}|g" .env
    
    echo -e "${GREEN}✅ Arquivo .env configurado com DATABASE_URL atualizado${NC}"
    echo "   DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
fi

# ===========================================
# 6. Instalar dependências
# ===========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 Instalando dependências do projeto...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "Isso pode levar alguns minutos..."
if pnpm install; then
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
else
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

# ===========================================
# 7. Build shared packages
# ===========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔨 Construindo pacotes compartilhados...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

pnpm run build --filter=@seminario/shared-config || echo -e "${YELLOW}⚠️  Aviso: Build de shared-config pode ter falhado (normal se já estiver buildado)${NC}"
pnpm run build --filter=@seminario/shared-auth || echo -e "${YELLOW}⚠️  Aviso: Build de shared-auth pode ter falhado (normal se já estiver buildado)${NC}"

# ===========================================
# 8. Aplicar schema do banco de dados
# ===========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Aplicando schema do banco de dados...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd apps/api
if pnpm run db:push; then
    echo -e "${GREEN}✅ Schema aplicado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao aplicar schema${NC}"
    echo "   Verifique se:"
    echo "   1. O banco de dados foi criado"
    echo "   2. O DATABASE_URL no .env está correto"
    echo "   3. O PostgreSQL está rodando"
    cd "$PROJECT_ROOT"
    exit 1
fi
cd "$PROJECT_ROOT"

# ===========================================
# 9. Resumo final
# ===========================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuração concluída com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo ""
echo "1. Iniciar o servidor de desenvolvimento:"
echo "   ${YELLOW}pnpm dev${NC}"
echo ""
echo "2. Acessar o sistema:"
echo "   ${YELLOW}Portal: http://localhost:3001${NC}"
echo "   ${YELLOW}API: http://localhost:4000${NC}"
echo "   ${YELLOW}Documentação: http://localhost:4000/docs${NC}"
echo ""
echo "3. Credenciais de teste:"
echo "   ${YELLOW}Admin: admin@seminario.edu / admin123${NC}"
echo "   ${YELLOW}Secretaria: secretaria@seminario.edu / test123${NC}"
echo ""
echo "4. (Opcional) Popular com dados de teste:"
echo "   ${YELLOW}pnpm --filter @seminario/api db:seed${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

