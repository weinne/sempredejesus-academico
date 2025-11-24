#!/bin/bash
# Script para preparar o ambiente antes de abrir o devcontainer
# Execute: .devcontainer/prepare.sh

echo "🔍 Preparando ambiente devcontainer..."

# Verificar se a porta 5432 está ocupada
check_port() {
    local port=$1
    if command -v ss > /dev/null 2>&1; then
        ss -lnt | grep ":$port " > /dev/null 2>&1
        return $?
    elif command -v lsof > /dev/null 2>&1; then
        lsof -i :$port > /dev/null 2>&1
        return $?
    else
        return 1
    fi
}

# Verificar porta 5432
if check_port 5432; then
    echo "⚠️  Porta 5432 está ocupada!"
    echo ""
    echo "🔍 Verificando portas alternativas..."
    
    for port in 5433 5434; do
        if ! check_port $port; then
            echo "✅ Porta $port está disponível"
            echo ""
            echo "💡 Execute antes de abrir o container:"
            echo "   export POSTGRES_PORT=$port"
            echo ""
            echo "   Ou crie .devcontainer/.env com:"
            echo "   POSTGRES_PORT=$port"
            exit 0
        fi
    done
    
    echo "❌ Nenhuma porta alternativa disponível (5433, 5434)"
    echo "💡 Libere uma porta ou use uma diferente"
else
    echo "✅ Porta 5432 está disponível"
    echo "✅ Pronto para abrir o container!"
fi

# Verificar containers antigos
if docker ps -a | grep -q "seminario_db_dev\|seminario_dev"; then
    echo ""
    echo "⚠️  Encontrados containers antigos"
    echo "💡 Para remover: docker rm -f seminario_db_dev seminario_dev"
fi

echo ""
echo "📚 Para mais ajuda, veja: .devcontainer/TROUBLESHOOTING.md"

