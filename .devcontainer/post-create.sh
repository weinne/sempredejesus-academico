#!/bin/bash
# Script executado após a criação do container
# Este script é chamado automaticamente pelo devcontainer

set -e

echo "🚀 Configurando ambiente devcontainer..."

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm não encontrado!"
    exit 1
fi

echo "✅ pnpm encontrado: $(pnpm --version)"

# Instalar dependências
echo "📦 Instalando dependências..."
pnpm install

# Aplicar schema do banco
echo "🗄️  Aplicando schema do banco de dados..."
pnpm db:push || {
    echo "⚠️  Erro ao aplicar schema. Verificando conexão com banco..."
    # Aguardar banco estar pronto
    sleep 5
    pnpm db:push || echo "⚠️  Schema não aplicado. Execute manualmente: pnpm db:push"
}

echo "✅ Configuração concluída!"

