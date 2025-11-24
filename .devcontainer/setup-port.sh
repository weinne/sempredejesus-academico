#!/bin/bash
# Script para configurar automaticamente a porta do PostgreSQL
# Este script é executado antes do docker-compose iniciar

check_port() {
    local port=$1
    if command -v ss > /dev/null 2>&1; then
        ss -lnt | grep ":$port " > /dev/null 2>&1
        return $?
    elif command -v lsof > /dev/null 2>&1; then
        lsof -i :$port > /dev/null 2>&1
        return $?
    elif command -v netstat > /dev/null 2>&1; then
        netstat -an | grep ":$port " > /dev/null 2>&1
        return $?
    else
        # Se não conseguir verificar, assume que está disponível
        return 1
    fi
}

# Se POSTGRES_PORT já estiver definida, usa ela
if [ -n "$POSTGRES_PORT" ]; then
    echo "Usando porta PostgreSQL configurada: $POSTGRES_PORT"
    exit 0
fi

# Tenta portas em ordem: 5432, 5433, 5434
for port in 5432 5433 5434; do
    if ! check_port $port; then
        echo "Porta $port está disponível, configurando POSTGRES_PORT=$port"
        export POSTGRES_PORT=$port
        # Salva em arquivo para o docker-compose usar
        echo "POSTGRES_PORT=$port" > /tmp/devcontainer-postgres-port.env
        exit 0
    fi
done

# Se nenhuma porta estiver disponível, usa 5432 como padrão
echo "Nenhuma porta disponível, usando 5432 como padrão"
export POSTGRES_PORT=5432
echo "POSTGRES_PORT=5432" > /tmp/devcontainer-postgres-port.env

