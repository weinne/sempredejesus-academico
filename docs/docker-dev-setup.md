# 🐳 Guia Completo de Desenvolvimento com Docker

Este guia mostra como configurar e usar o ambiente de desenvolvimento completo usando Docker.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Node.js** ≥18.0.0 ([Download](https://nodejs.org/))
- **pnpm** ≥8.0.0 (`npm install -g pnpm`)

## 🚀 Setup Rápido (Recomendado)

### Opção 1: Script Automático (Mais Fácil)

Execute o script de setup completo que configura tudo automaticamente:

**Linux/macOS:**
```bash
./scripts/docker-dev-setup.sh
```

**Windows PowerShell:**
```powershell
.\scripts\docker-dev-setup.ps1
```

O script irá:
- ✅ Verificar pré-requisitos (Docker, pnpm)
- ✅ Criar arquivo `.env` se não existir
- ✅ Iniciar container PostgreSQL
- ✅ Instalar dependências do projeto
- ✅ Aplicar schema do banco de dados
- ✅ Mostrar informações de conexão e próximos passos

### Opção 2: Setup Manual

Se preferir fazer manualmente:

#### 1. Criar arquivo `.env`

Copie o template e ajuste conforme necessário:

```bash
# Na raiz do projeto
cp .env.example .env
```

Ou crie manualmente com estas variáveis:

```env
DATABASE_URL="postgresql://postgres:passwd@localhost:5432/seminario_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-change-in-production"
PORT=4000
NODE_ENV="development"
APP_URL="http://localhost:3001"
API_URL="http://localhost:4000"
UPLOAD_MAX_SIZE="5mb"
UPLOAD_PATH="./uploads"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 2. Iniciar PostgreSQL

```bash
# Iniciar apenas o banco de dados
pnpm docker:dev

# Ou usando docker compose diretamente
docker compose -f docker-compose.dev.yml up -d db
```

#### 3. Instalar Dependências

```bash
pnpm install
```

#### 4. Aplicar Schema do Banco

```bash
# Aplicar schema usando Drizzle
pnpm db:push
```

#### 5. Iniciar Desenvolvimento

```bash
# Iniciar API + Portal
pnpm dev

# Ou apenas API
pnpm --filter @seminario/api dev

# Ou apenas Portal
pnpm --filter @seminario/portal dev
```

## 📊 Estrutura do Docker Compose

O arquivo `docker-compose.dev.yml` contém:

### Serviços Disponíveis

#### 1. **PostgreSQL Database** (`db`)
- **Imagem**: `postgres:15-alpine`
- **Porta**: `5432`
- **Database**: `seminario_db`
- **Usuário**: `postgres`
- **Senha**: `passwd`
- **Configurações**:
  - Extensões: `uuid-ossp`, `pg_trgm`
  - Timezone: `America/Sao_Paulo`
  - Logs de queries habilitados (útil para debug)
  - Configurações de memória otimizadas para desenvolvimento

#### 2. **Adminer** (GUI Web - Opcional)
- **Porta**: `8080`
- **Acesso**: http://localhost:8080
- **Como iniciar**: `pnpm docker:dev:tools` ou `docker compose -f docker-compose.dev.yml --profile tools up -d adminer`

#### 3. **pgAdmin** (GUI Avançado - Opcional)
- **Porta**: `5050`
- **Acesso**: http://localhost:5050
- **Email**: `admin@seminario.edu`
- **Senha**: `admin123`
- **Como iniciar**: `pnpm docker:dev:tools` ou `docker compose -f docker-compose.dev.yml --profile tools up -d pgadmin`

## 🛠️ Scripts Disponíveis

### Docker

```bash
# Iniciar apenas o banco de dados
pnpm docker:dev

# Parar containers
pnpm docker:dev:down

# Ver logs do PostgreSQL
pnpm docker:dev:logs

# Iniciar ferramentas (Adminer/pgAdmin)
pnpm docker:dev:tools
```

### Banco de Dados

```bash
# Aplicar schema (push direto)
pnpm db:push

# Gerar e aplicar migrations
pnpm db:migrate

# Abrir Drizzle Studio (GUI)
pnpm db:studio

# Popular com dados de teste
pnpm db:seed
```

## 🔧 Configurações do PostgreSQL

### Extensões Instaladas Automaticamente

- **uuid-ossp**: Geração de UUIDs
- **pg_trgm**: Busca de texto com índice (LIKE otimizado)

### Configurações de Performance

- **shared_buffers**: 256MB
- **max_connections**: 200
- **timezone**: America/Sao_Paulo
- **log_statement**: all (todas as queries são logadas)

### Scripts de Inicialização

Os scripts em `scripts/docker-init/` são executados automaticamente quando o container é criado pela primeira vez:

- `01-init-extensions.sql`: Instala extensões e configura o banco

## 📝 Comandos Úteis

### Verificar Status dos Containers

```bash
docker compose -f docker-compose.dev.yml ps
```

### Ver Logs do PostgreSQL

```bash
# Logs em tempo real
docker compose -f docker-compose.dev.yml logs -f db

# Últimas 100 linhas
docker compose -f docker-compose.dev.yml logs --tail=100 db
```

### Conectar ao PostgreSQL via CLI

```bash
# Conectar ao banco
docker exec -it seminario_db_dev psql -U postgres -d seminario_db

# Executar comando SQL
docker exec seminario_db_dev psql -U postgres -d seminario_db -c "SELECT version();"
```

### Limpar e Recriar

```bash
# Parar e remover containers (mantém volumes)
docker compose -f docker-compose.dev.yml down

# Parar e remover containers + volumes (CUIDADO: apaga dados!)
docker compose -f docker-compose.dev.yml down -v

# Recriar tudo do zero
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d db
```

## 🔍 Troubleshooting

### PostgreSQL não inicia

1. Verifique se a porta 5432 está livre:
   ```bash
   # Windows
   netstat -ano | findstr :5432
   
   # Linux/macOS
   lsof -i :5432
   ```

2. Verifique logs do container:
   ```bash
   docker compose -f docker-compose.dev.yml logs db
   ```

3. Remova e recrie o container:
   ```bash
   docker compose -f docker-compose.dev.yml down -v
   docker compose -f docker-compose.dev.yml up -d db
   ```

### Erro de conexão com o banco

1. Verifique se o container está rodando:
   ```bash
   docker ps | grep seminario_db_dev
   ```

2. Verifique a variável `DATABASE_URL` no arquivo `.env`

3. Teste a conexão:
   ```bash
   docker exec seminario_db_dev pg_isready -U postgres
   ```

### Schema não aplica

1. Verifique se o banco está acessível:
   ```bash
   docker exec seminario_db_dev psql -U postgres -d seminario_db -c "\dt"
   ```

2. Aplique manualmente:
   ```bash
   cd apps/api
   pnpm run db:push
   ```

### Usuários de teste não são criados

Os usuários de teste são criados automaticamente quando o servidor inicia em desenvolvimento. Verifique:

1. Se `NODE_ENV=development` no `.env`
2. Se o servidor está rodando (`pnpm dev`)
3. Logs do servidor para ver mensagens de criação

## 🌐 URLs de Acesso

Após iniciar tudo, você pode acessar:

- **Portal (Frontend)**: http://localhost:3001
- **API**: http://localhost:4000
- **API Docs (Swagger)**: http://localhost:4000/docs
- **Health Check**: http://localhost:4000/health
- **Adminer** (se iniciado): http://localhost:8080
- **pgAdmin** (se iniciado): http://localhost:5050

## 🔐 Credenciais de Teste

Em desenvolvimento, os seguintes usuários são criados automaticamente:

- **ADMIN**: `admin@seminario.edu` / `admin123`
- **SECRETARIA**: `secretaria@seminario.edu` / `test123`
- **PROFESSOR**: `professor@seminario.edu` / `test123`
- **ALUNO**: `aluno@seminario.edu` / `test123`

## 📚 Próximos Passos

1. ✅ Ambiente configurado
2. ✅ Banco de dados rodando
3. ✅ Schema aplicado
4. 🚀 Execute `pnpm dev` para começar a desenvolver!

## 💡 Dicas

- Use **Drizzle Studio** (`pnpm db:studio`) para visualizar e editar dados facilmente
- Os logs do PostgreSQL mostram todas as queries executadas (útil para debug)
- Use **Adminer** ou **pgAdmin** para gerenciar o banco visualmente
- Os dados persistem em volumes Docker mesmo após parar os containers
- Para resetar tudo, use `docker compose -f docker-compose.dev.yml down -v`

---

**Problemas?** Consulte a seção [Troubleshooting](#-troubleshooting) ou abra uma issue no repositório.
