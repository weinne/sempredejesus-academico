#!/bin/bash
# Script para verificar e sugerir porta disponível para PostgreSQL
# Uso: ./check-port.sh [porta_inicial]
# Exemplo: ./check-port.sh 5432

check_port() {
    local port=$1
    if command -v lsof > /dev/null 2>&1; then
        lsof -i :$port > /dev/null 2>&1
        return $?
    elif command -v netstat > /dev/null 2>&1; then
        netstat -an | grep ":$port " > /dev/null 2>&1
        return $?
    elif command -v ss > /dev/null 2>&1; then
        ss -lnt | grep ":$port " > /dev/null 2>&1
        return $?
    else
        # Se não conseguir verificar, assume que está disponível
        return 1
    fi
}

START_PORT=${1:-5432}

echo "🔍 Verificando portas disponíveis para PostgreSQL..."
echo ""

# Tenta portas em ordem: START_PORT, START_PORT+1, START_PORT+2
for offset in 0 1 2; do
    port=$((START_PORT + offset))
    if ! check_port $port; then
        echo "✅ Porta $port está DISPONÍVEL"
        echo ""
        echo "💡 Para usar esta porta, crie um arquivo .env em .devcontainer/ com:"
        echo "   POSTGRES_PORT=$port"
        echo ""
        echo "   Ou defina a variável antes de iniciar o container:"
        echo "   export POSTGRES_PORT=$port"
        exit 0
    else
        echo "❌ Porta $port está OCUPADA"
    fi
done

echo ""
echo "⚠️  Nenhuma das portas $START_PORT, $((START_PORT+1)), $((START_PORT+2)) está disponível."
echo "💡 Tente usar uma porta diferente ou libere uma das portas acima."
exit 1

