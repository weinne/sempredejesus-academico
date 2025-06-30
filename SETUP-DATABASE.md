# 🗄️ Database Setup - Sistema Acadêmico

## ✅ **Configuração Corrigida**

### **Problema Resolvido**
- ❌ **Antes**: Docker executava automaticamente `Dump20180203.sql` (schema legado)
- ✅ **Agora**: Banco PostgreSQL inicia vazio, schema criado pelo Drizzle ORM

### **Mudanças Aplicadas**
```diff
# docker-compose.yml & docker-compose.dev.yml
volumes:
  - postgres_data:/var/lib/postgresql/data
- - ./Dump20180203.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

---

## 🚀 **Setup Options**

### **Opção A: Docker (Recomendado)**

#### 1. Instalar Docker Desktop
```bash
# Baixar: https://www.docker.com/products/docker-desktop/
# Instalar e reiniciar o sistema
```

#### 2. Iniciar PostgreSQL
```bash
# Development
docker compose -f docker-compose.dev.yml up -d db

# Ou production
docker compose up -d db
```

#### 3. Aplicar Schema
```bash
cd apps/api
pnpm run db:push
```

### **Opção B: PostgreSQL Local**

#### 1. Instalar PostgreSQL
```bash
# Windows: https://www.postgresql.org/download/windows/
# Escolher versão 15+ 
# Senha sugerida: passwd
```

#### 2. Criar Database
```sql
-- Conectar como postgres
createdb seminario_db
```

#### 3. Configurar .env
```env
DATABASE_URL="postgresql://postgres:passwd@localhost:5432/seminario_db"
```

#### 4. Aplicar Schema
```bash
cd apps/api
pnpm run db:push
```

### **Opção C: PostgreSQL Cloud (Desenvolvimento)**

#### Services Gratuitos
- **Supabase**: https://supabase.com/
- **Neon**: https://neon.tech/
- **Railway**: https://railway.app/

#### Setup
1. Criar conta e database
2. Copiar CONNECTION_STRING 
3. Atualizar `.env`:
```env
DATABASE_URL="sua-connection-string-aqui"
```

---

## ⚙️ **Configuração Environment**

### **1. Criar .env (na raiz do projeto)**
```bash
cp .env.example .env
```

### **2. Configurar Variables**
```env
# 🗄️ DATABASE (use a senha escolhida)
DATABASE_URL="postgresql://postgres:passwd@localhost:5432/seminario_db"

# 🔐 JWT AUTHENTICATION
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-change-in-production"

# 🌐 SERVER
PORT=4000
NODE_ENV="development"
APP_URL="http://localhost:3000"
API_URL="http://localhost:4000"
```

---

## 🧪 **Teste da Configuração**

### **1. Verificar Conexão**
```bash
cd apps/api
pnpm run db:push
```

### **2. Abrir Drizzle Studio**
```bash
pnpm run db:studio
# Acesse: http://localhost:4983
```

### **3. Verificar Tabelas Criadas**
- `pessoas` - Dados pessoais base
- `users` - Autenticação/login  
- `alunos`, `professores` - Academic
- `cursos`, `disciplinas` - Curriculum
- `turmas`, `aulas` - Classes
- `avaliacoes`, `frequencias` - Operations

---

## ✅ **Próximos Passos**

Após banco funcionando:

1. **Testar API**: `pnpm run dev`
2. **Implementar CRUD**: APIs completas
3. **Finalizar Sprint 1**: 100% Backend Core

---

## 🐛 **Troubleshooting**

### **Error: ECONNREFUSED**
```bash
# Verificar se PostgreSQL está rodando
# Docker:
docker compose ps

# Local:
# Windows: Services → PostgreSQL
```

### **Error: Database doesn't exist**
```bash
# Docker: reiniciar container
docker compose down && docker compose up -d db

# Local: criar manualmente
createdb seminario_db
```

### **Error: Authentication failed**
- Verificar senha no `DATABASE_URL`
- Senha padrão nos docker-compose: `passwd`

---

**Status**: Schema configurado ✅ | Banco pendente ⏳ | APIs próximo passo 🚀 