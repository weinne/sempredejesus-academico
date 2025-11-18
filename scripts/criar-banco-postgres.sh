#!/bin/bash
# Script para criar banco de dados PostgreSQL
# Execute quando tiver acesso sudo

set +e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DB_NAME="seminario_db"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🗄️  Criando Banco de Dados PostgreSQL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar porta do PostgreSQL
echo "Verificando porta do PostgreSQL..."
PG_PORT=$(pg_lsclusters | awk 'NR==2 {print $3}')
if [ -z "$PG_PORT" ]; then
    echo -e "${YELLOW}⚠️  Não foi possível detectar porta automaticamente${NC}"
    echo "   Usando porta padrão 5432"
    PG_PORT="5432"
else
    echo -e "${GREEN}✅ PostgreSQL rodando na porta: $PG_PORT${NC}"
fi
echo ""

# Verificar se o banco já existe
if sudo -u postgres psql -p "$PG_PORT" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}⚠️  Banco de dados '$DB_NAME' já existe${NC}"
    read -p "Deseja recriar? Isso apagará todos os dados! (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "Removendo banco existente..."
        sudo -u postgres psql -p "$PG_PORT" -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
    else
        echo "Mantendo banco existente."
        exit 0
    fi
fi

# Criar banco de dados
echo "Criando banco de dados '$DB_NAME'..."
if sudo -u postgres psql -p "$PG_PORT" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null; then
    echo -e "${GREEN}✅ Banco de dados criado com sucesso!${NC}"
    echo ""
    echo "Verificando..."
    sudo -u postgres psql -p "$PG_PORT" -l | grep "$DB_NAME"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "   Certifique-se de atualizar o .env com a porta correta:"
    echo "   DATABASE_URL=\"postgresql://postgres:3682@localhost:$PG_PORT/seminario_db\""
else
    echo -e "${RED}❌ Erro ao criar banco de dados${NC}"
    echo ""
    echo "Possíveis causas:"
    echo "1. Você não tem permissão sudo"
    echo "2. PostgreSQL não está rodando"
    echo ""
    echo "Execute manualmente:"
    echo "   ${YELLOW}sudo -u postgres psql -p $PG_PORT -c \"CREATE DATABASE $DB_NAME;\"${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Pronto! Banco de dados criado${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
