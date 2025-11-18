# 🚀 Guia de Configuração - Ambiente Nativo Ubuntu/Xubuntu

Este guia te ajudará a configurar o ambiente de desenvolvimento nativo no Ubuntu/Xubuntu.

## 📋 Pré-requisitos

- Ubuntu/Xubuntu instalado
- PostgreSQL instalado
- Acesso sudo para instalação de pacotes e configuração do banco

---

## 🔧 Passo 1: Instalar Node.js e npm

### Opção A: Via apt (Recomendado para Ubuntu)

```bash
# Atualizar lista de pacotes
sudo apt update

# Instalar Node.js e npm
sudo apt install -y nodejs npm

# Verificar versão (deve ser >= 18)
node --version
npm --version
```

**Nota:** Se a versão do Node.js for menor que 18, use a Opção B.

### Opção B: Via NodeSource (Node.js 18+)

```bash
# Instalar curl se não tiver
sudo apt install -y curl

# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar versão
node --version
npm --version
```

### Opção C: Via nvm (Node Version Manager)

```bash
# Instalar curl se não tiver
sudo apt install -y curl

# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recarregar o shell
source ~/.bashrc

# Instalar Node.js 18
nvm install 18
nvm use 18

# Verificar versão
node --version
npm --version
```

---

## 📦 Passo 2: Instalar pnpm

```bash
# Instalar pnpm globalmente com sudo
sudo npm install -g pnpm

# Verificar versão (deve ser >= 8)
pnpm --version
```

**Alternativa:** Se preferir usar corepack (método oficial):
```bash
sudo corepack enable
corepack prepare pnpm@latest --activate
```

---

## 🗄️ Passo 3: Configurar PostgreSQL

### 3.1. Verificar se o PostgreSQL está rodando

```bash
# Verificar status do serviço
sudo systemctl status postgresql

# Se não estiver rodando, iniciar
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.2. Verificar porta do PostgreSQL

**IMPORTANTE:** O PostgreSQL pode estar rodando em uma porta diferente da padrão (5432).

```bash
# Verificar porta
pg_lsclusters

# Ou
sudo netstat -tlnp | grep postgres
# ou
sudo ss -tlnp | grep postgres
```

**Anote a porta!** Você precisará dela para configurar o `.env`.

### 3.3. Criar banco de dados

```bash
# Conectar como usuário postgres (via socket Unix, não precisa senha)
sudo -u postgres psql

# No prompt do PostgreSQL, executar:
CREATE DATABASE seminario_db;

# Configurar senha do usuário postgres
ALTER USER postgres WITH PASSWORD '3682';

# Sair do PostgreSQL
\q
```

**Ou via linha de comando direta:**

```bash
sudo -u postgres psql -c "CREATE DATABASE seminario_db;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '3682';"
```

### 3.4. Verificar se o banco foi criado

```bash
sudo -u postgres psql -l | grep seminario_db
```

---

## ⚙️ Passo 4: Configurar variáveis de ambiente

### 4.1. Criar arquivo .env

```bash
cd /home/weinne/Dev/sempredejesus-academico

# Copiar arquivo de exemplo
cp .env.example .env
```

### 4.2. Editar arquivo .env

Abra o arquivo `.env` e atualize a linha `DATABASE_URL` com suas credenciais e **porta correta**:

```env
# IMPORTANTE: Use a porta correta do PostgreSQL (pode ser 5432 ou 5433)
DATABASE_URL="postgresql://postgres:3682@localhost:5433/seminario_db"
```

**Substitua `5433` pela porta que você encontrou no passo 3.2!**

O arquivo `.env` completo deve ter algo como:

```env
# 🗄️ DATABASE
DATABASE_URL="postgresql://postgres:3682@localhost:5433/seminario_db"

# 🔐 JWT AUTHENTICATION  
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-change-in-production"

# 🌐 SERVER
PORT=4000
NODE_ENV="development"
APP_URL="http://localhost:3001"
API_URL="http://localhost:4000"
```

---

## 📦 Passo 5: Instalar dependências do projeto

```bash
# No diretório raiz do projeto
cd /home/weinne/Dev/sempredejesus-academico

# Instalar todas as dependências
pnpm install
```

Isso pode levar alguns minutos na primeira vez.

---

## 🔨 Passo 6: Build dos pacotes compartilhados

```bash
# Construir pacotes compartilhados
pnpm run build --filter=@seminario/shared-config
pnpm run build --filter=@seminario/shared-auth
```

---

## 📊 Passo 7: Aplicar schema do banco de dados

```bash
# Aplicar schema (criar tabelas)
cd apps/api
pnpm run db:push
cd ../..
```

Isso criará todas as tabelas e estruturas necessárias no banco de dados.

---

## ✅ Passo 8: Verificar instalação

### 8.1. Testar conexão com o banco

```bash
# Verificar se as tabelas foram criadas
sudo -u postgres psql -p 5433 -d seminario_db -c "\dt"
# (substitua 5433 pela sua porta)
```

Você deve ver uma lista de tabelas como `pessoas`, `users`, `alunos`, etc.

### 8.2. Iniciar o servidor de desenvolvimento

```bash
# No diretório raiz
pnpm dev
```

Isso iniciará tanto a API quanto o Portal.

### 8.3. Acessar o sistema

Após iniciar, você pode acessar:

- **Portal (Frontend):** http://localhost:3001
- **API (Backend):** http://localhost:4000
- **Documentação API:** http://localhost:4000/docs
- **Health Check:** http://localhost:4000/health

---

## 🧪 Passo 9: (Opcional) Popular com dados de teste

```bash
# Popular banco com dados de teste
pnpm --filter @seminario/api db:seed
```

---

## 🔑 Credenciais de Teste

Após iniciar o servidor, você pode usar estas credenciais:

- **Administrador:**
  - Email: `admin@seminario.edu`
  - Senha: `admin123`

- **Secretaria:**
  - Email: `secretaria@seminario.edu`
  - Senha: `test123`

- **Professor:**
  - Email: `professor@seminario.edu`
  - Senha: `test123`

- **Aluno:**
  - Email: `aluno@seminario.edu`
  - Senha: `test123`

---

## 🐛 Troubleshooting

### Erro de autenticação PostgreSQL

Se receber "password authentication failed":

1. **Verificar porta:** O PostgreSQL pode estar em outra porta (ex: 5433)
   ```bash
   pg_lsclusters
   ```

2. **Verificar senha:** Certifique-se de que a senha está configurada
   ```bash
   sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '3682';"
   ```

3. **Verificar DATABASE_URL:** Certifique-se de que o `.env` tem a porta correta
   ```bash
   cat .env | grep DATABASE_URL
   ```

### Erro ao instalar dependências

```bash
# Limpar cache e tentar novamente
pnpm store prune
rm -rf node_modules
pnpm install
```

### Erro ao aplicar schema

```bash
# Verificar se o DATABASE_URL está correto no .env
cat .env | grep DATABASE_URL

# Tentar novamente
cd apps/api
pnpm run db:push
```

### Porta já em uso

Se a porta 4000 ou 3001 estiver em uso:

```bash
# Verificar o que está usando a porta
sudo lsof -i :4000
sudo lsof -i :3001

# Ou alterar a porta no .env
PORT=4001  # para API
APP_URL="http://localhost:3002"  # para Portal
```

---

## 📚 Comandos Úteis

```bash
# Iniciar desenvolvimento
pnpm dev

# Apenas API
pnpm --filter @seminario/api dev

# Apenas Portal
pnpm --filter @seminario/portal dev

# Aplicar schema novamente
cd apps/api && pnpm run db:push

# Visualizar banco (Drizzle Studio)
cd apps/api && pnpm run db:studio

# Rodar testes
pnpm test

# Verificar tipos TypeScript
pnpm typecheck
```

---

## ✅ Checklist Final

- [ ] Node.js >= 18 instalado
- [ ] pnpm >= 8 instalado
- [ ] PostgreSQL rodando
- [ ] Porta do PostgreSQL identificada
- [ ] Banco `seminario_db` criado
- [ ] Senha do PostgreSQL configurada
- [ ] Arquivo `.env` configurado com porta correta
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Pacotes compartilhados buildados
- [ ] Schema aplicado (`pnpm run db:push`)
- [ ] Servidor iniciando sem erros (`pnpm dev`)

---

**🎉 Pronto! Seu ambiente está configurado e pronto para desenvolvimento!**
