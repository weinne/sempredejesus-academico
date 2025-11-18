FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Instalar pnpm globalmente
RUN npm install -g pnpm@latest turbo

# Instalar ferramentas úteis
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Configurar usuário
USER node

# Definir diretório de trabalho
WORKDIR /workspace

