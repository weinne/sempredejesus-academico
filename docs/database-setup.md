# 🗄️ Database Setup Guide

## 📋 Pré-requisitos

### 1. PostgreSQL Installation
Você pode usar PostgreSQL de duas formas:

#### Opção A: Docker (Recomendado)
```bash
# Instalar Docker Desktop se não tiver
# https://www.docker.com/products/docker-desktop/

# Iniciar apenas o banco via Docker
docker compose up -d db

# Verificar se está rodando
docker compose ps
```

#### Opção B: PostgreSQL Local
```bash
# Windows: Baixar do site oficial
# https://www.postgresql.org/download/windows/

# Criar database
createdb seminario_db
```

---

## ⚙️ Environment Variables

### 1. Criar arquivo .env
```bash
# Copiar o template
cp .env.example .env

# Editar com suas configurações
```

### 2. Variáveis Essenciais
```env
# 🗄️ DATABASE
DATABASE_URL="postgresql://postgres:Jesusv!ve1@localhost:5432/seminario_db"

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

## 🚀 Database Setup

### 1. Build Shared Packages
```bash
# Construir configurações compartilhadas
pnpm run build --filter=@seminario/shared-config
```

### 2. Generate & Run Migrations
```bash
cd apps/api

# Gerar migrations (já feito)
pnpm run db:migrate

# Ou se preferir push direto 
pnpm run db:push
```

### 3. Verificar Schema
```bash
# Abrir Drizzle Studio para visualizar
pnpm run db:studio
```

### 4. Popular com Dados (Opcional)
```bash
# Executar seeds
pnpm run db:seed
```

---

## 🔧 Scripts Disponíveis

### API Database Scripts
```bash
cd apps/api

# Gerar migrations
pnpm drizzle-kit generate:pg

# Aplicar migrations  
pnpm drizzle-kit migrate:pg

# Push schema (sem migrations)
pnpm run db:push

# Visualizar banco
pnpm run db:studio

# Popular com dados
pnpm run db:seed
```

### Root Scripts
```bash
# Construir shared packages
pnpm run build --filter=@seminario/shared-config
pnpm run build --filter=@seminario/shared-auth

# Iniciar desenvolvimento
pnpm run dev
```

---

## 📊 Schema Overview

### Tabelas Criadas (15 total)
```
Core:
- pessoas (dados pessoais base)
- users (autenticação/login)

Academic:
- alunos (extends pessoas)
- professores (extends pessoas)  
- cursos (lista de cursos)
- disciplinas (matérias)

Classes:
- semestres (períodos letivos)
- turmas (turmas de disciplinas)
- aulas (aulas ministradas)
- avaliacoes (provas/trabalhos)

Operations:
- avaliacoes_alunos (notas)
- turmas_inscritos (matriculas)
- frequencias (presença)
- calendario (eventos)
- configuracoes (sistema)
```

### Enums (5 total)
```
- user_role: ADMIN, SECRETARIA, PROFESSOR, ALUNO
- situacao_aluno: ATIVO, TRANCADO, CONCLUIDO, CANCELADO
- situacao_professor: ATIVO, INATIVO
- tipo_avaliacao: PROVA, TRABALHO, PARTICIPACAO, OUTRO
- status_inscricao: MATRICULADO, CANCELADO, APROVADO, REPROVADO
```

---

## 🐛 Troubleshooting

### Connection Refused
```bash
# Verificar se PostgreSQL está rodando
docker compose ps
# ou
sudo systemctl status postgresql

# Iniciar se necessário
docker compose up -d db
```

### Authentication Failed
- Verificar credenciais no `DATABASE_URL`
- Senha padrão: `Jesusv!ve1`
- Usuario padrão: `postgres`

### Database Doesn't Exist
```bash
# Com Docker
docker compose up -d db

# Local PostgreSQL
createdb seminario_db
```

### Migration Errors
```bash
# Limpar e recriar
pnpm run db:push

# Ou resetar migrations
rm -rf apps/api/src/db/migrations/
pnpm drizzle-kit generate:pg
```

---

## ✅ Next Steps

Após configurar o banco:

1. **Teste a conexão**: `pnpm run dev` 
2. **Acesse Drizzle Studio**: `pnpm run db:studio`
3. **Popular dados**: `pnpm run db:seed`
4. **Implementar APIs**: Continuar com CRUD endpoints

---

## 📝 Migration Files

Gerado automaticamente em `apps/api/src/db/migrations/`:
- `0000_sharp_hawkeye.sql` - Schema inicial completo
- `meta/` - Metadados das migrations 