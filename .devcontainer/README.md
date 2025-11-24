# 🐳 Dev Container - VS Code/Cursor

Este diretório contém a configuração para desenvolver dentro de um container Docker usando VS Code ou Cursor.

## 📋 Pré-requisitos

1. **VS Code** ou **Cursor** instalado
2. Extensão **Dev Containers** instalada:
   - VS Code: [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - Cursor: Já vem pré-instalado
3. **Docker Desktop** instalado e rodando

## 🚀 Como Usar

### Passo 0: Preparar Ambiente (Recomendado)

Antes de abrir o container, execute o script de preparação:

```bash
.devcontainer/prepare.sh
```

Este script verifica se a porta 5432 está disponível e sugere alternativas se necessário.

### Opção 1: Abrir em Container (Recomendado)

1. **Se a porta 5432 estiver ocupada**, defina uma porta alternativa:
   ```bash
   export POSTGRES_PORT=5433
   ```

2. Abra o projeto no VS Code/Cursor

3. Pressione `F1` (ou `Ctrl+Shift+P` / `Cmd+Shift+P`)

4. Digite: `Dev Containers: Reopen in Container`

5. Selecione a opção

6. Aguarde o container ser construído e iniciado (primeira vez pode demorar)

### Opção 2: Comando de Paleta

1. `F1` → `Dev Containers: Reopen Folder in Container`

### Opção 3: Botão na Barra Inferior

1. Clique no botão verde `><` na barra inferior esquerda
2. Selecione `Reopen in Container`

## ✅ O que acontece automaticamente

- ✅ Container Docker é construído com Node.js 20 e pnpm 10.22.0
- ✅ PostgreSQL 15 é iniciado automaticamente
- ✅ Dependências são instaladas (`pnpm install`)
- ✅ Schema do banco é aplicado (`pnpm db:push`)
- ✅ Portas são forwardadas automaticamente (3001, 4000, 5432, 8080)
- ✅ Extensões úteis são instaladas automaticamente
- ✅ Variáveis de ambiente são configuradas automaticamente
- ✅ Docker-in-Docker habilitado para usar docker-compose dentro do container

## 🛠️ Comandos Disponíveis

Dentro do container, você pode usar todos os comandos normalmente:

```bash
# Desenvolvimento
pnpm dev              # API + Portal
pnpm --filter @seminario/api dev    # Apenas API
pnpm --filter @seminario/portal dev # Apenas Portal

# Banco de dados
pnpm db:push          # Aplicar schema
pnpm db:studio        # Abrir Drizzle Studio
pnpm db:seed          # Popular com dados

# Testes
pnpm test             # Executar testes
pnpm lint             # Verificar código
pnpm typecheck        # Verificar tipos
```

## 🔌 Conexão com Banco de Dados

O PostgreSQL está disponível em:
- **Host**: `db` (dentro do container) ou `localhost` (do host)
- **Porta**: `5432` (padrão) ou `5433`/`5434` se configurado
- **Database**: `seminario_db`
- **Usuário**: `postgres`
- **Senha**: `passwd`

A variável `DATABASE_URL` já está configurada automaticamente para usar a porta padrão (5432) dentro do container.

**Nota:** Se você usar uma porta alternativa (5433 ou 5434), a conexão dentro do container continua usando `db:5432` (porta interna do container), mas do host você precisará usar a porta externa configurada.

## 🌐 Portas Forwardadas

- **3001**: Portal (Frontend)
- **4000**: API
- **5432**: PostgreSQL
- **8080**: Adminer (se iniciado com `--profile tools`)

## 📝 Notas

- O código é montado como volume, então mudanças são refletidas imediatamente
- `node_modules` são volumes nomeados para melhor performance
- O PostgreSQL persiste dados mesmo após fechar o container
- Para resetar tudo: `Dev Containers: Rebuild Container`

## 🔧 Troubleshooting

### Erro: "address already in use" na porta 5432

**Solução rápida:**
```bash
# Antes de abrir o container, defina:
export POSTGRES_PORT=5433
```

Depois abra o container normalmente. Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para mais detalhes.

### Container não inicia

1. Verifique se o Docker está rodando
2. **Execute o script de limpeza:**
   ```bash
   .devcontainer/cleanup.sh
   ```
   Ou manualmente:
   ```bash
   docker compose -f .devcontainer/docker-compose.yml down
   docker rm -f seminario_db_dev seminario_dev 2>/dev/null || true
   ```
3. Tente rebuild: `F1` → `Dev Containers: Rebuild Container`

### Portas não funcionam

1. Verifique se as portas não estão em uso
2. Configure port forwarding manualmente se necessário

### Porta PostgreSQL ocupada (5432)

Se a porta 5432 estiver ocupada, você pode usar portas alternativas:

**Opção 1: Usar variável de ambiente**
```bash
# Antes de abrir o container, defina:
export POSTGRES_PORT=5433
# ou
export POSTGRES_PORT=5434
```

**Opção 2: Criar arquivo .env**
Crie um arquivo `.devcontainer/.env` com:
```bash
POSTGRES_PORT=5433
```

**Opção 3: Verificar porta disponível**
Execute o script helper:
```bash
.devcontainer/check-port.sh
```

**Importante:** Se usar uma porta diferente de 5432, você precisará atualizar a `DATABASE_URL` no `devcontainer.json` ou criar um arquivo `.env` na raiz do projeto.

### Banco de dados não conecta

1. Verifique se o serviço `db` está saudável:
   ```bash
   docker ps | grep seminario_db_dev
   ```
2. Verifique os logs:
   ```bash
   docker logs seminario_db_dev
   ```
3. Teste a conexão:
   ```bash
   docker exec seminario_db_dev pg_isready -U postgres
   ```
4. Verifique qual porta está sendo usada:
   ```bash
   docker port seminario_db_dev
   ```
5. Execute: `docker compose -f .devcontainer/docker-compose.yml ps`

### Dependências não instalam

1. Execute manualmente: `pnpm install`
2. Verifique logs: `Dev Containers: Show Container Log`
3. Verifique se o pnpm está instalado: `pnpm --version` (deve mostrar 10.22.0)

### Variáveis de ambiente não funcionam

As variáveis de ambiente são configuradas automaticamente no `devcontainer.json`. Se precisar sobrescrever:
1. Crie um arquivo `.env` na raiz do projeto
2. Ou edite diretamente o `devcontainer.json` na seção `remoteEnv`

