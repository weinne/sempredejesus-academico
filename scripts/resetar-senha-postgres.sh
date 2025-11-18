#!/bin/bash
# Script para resetar senha do PostgreSQL após mudar método de autenticação

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SENHA="3682"

echo -e "${YELLOW}⚠️  Quando você muda de 'trust' para 'scram-sha-256', às vezes precisa resetar a senha${NC}"
echo ""
echo "Resetando senha do usuário postgres..."

# Resetar senha via socket Unix (não precisa senha)
if sudo -u postgres psql << EOF
ALTER USER postgres WITH PASSWORD '${SENHA}';
SELECT 'Senha resetada' as status;
\q
EOF
then
    echo -e "${GREEN}✅ Senha resetada${NC}"
    echo ""
    echo "Aguardando 2 segundos..."
    sleep 2
    
    echo "Testando conexão..."
    if PGPASSWORD="${SENHA}" psql -U postgres -h localhost -d seminario_db -c "SELECT current_database();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Conexão funcionando!${NC}"
    else
        echo -e "${RED}❌ Ainda não funciona${NC}"
        echo ""
        echo "Verificações adicionais:"
        echo "1. PostgreSQL foi recarregado? sudo systemctl reload postgresql"
        echo "2. Verificar logs: sudo tail -20 /var/log/postgresql/postgresql-*-main.log"
    fi
else
    echo -e "${RED}❌ Erro ao resetar senha${NC}"
    exit 1
fi

