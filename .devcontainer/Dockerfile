FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Instalar pnpm globalmente (versão específica conforme package.json)
RUN npm install -g pnpm@10.22.0 turbo

# Instalar ferramentas úteis
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    git \
    vim \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Configurar usuário
USER node

# Definir diretório de trabalho
WORKDIR /workspace

# Configurar pnpm para usar a versão correta
ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

