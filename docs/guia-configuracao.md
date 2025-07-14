# 🚀 Quick Setup Guide

## 1. Environment Variables
```bash
# Crie arquivo .env na raiz do projeto
DATABASE_URL="postgresql://postgres:password@localhost:5432/seminario_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-change-in-production"
PORT=4000
NODE_ENV="development"
APP_URL="http://localhost:3000"
API_URL="http://localhost:4000"
```

## 2. Database Setup

### Opção A: Docker (Recomendado)
```bash
# Instalar Docker Desktop: https://www.docker.com/products/docker-desktop/
docker compose up -d db
```

### Opção B: PostgreSQL Local
```bash
# Baixar PostgreSQL: https://www.postgresql.org/download/
# Criar database manualmente: seminario_db
```

## 3. Apply Schema
```bash
cd apps/api
pnpm run db:push
```

## 4. Start Development
```bash
pnpm run dev
```

## 5. Verify Setup
```bash
# Abrir Drizzle Studio
pnpm run db:studio

# Ou testar API
curl http://localhost:4000/health
```

---

## ✅ Status Atual

- [x] Sistema de Autenticação (JWT + bcrypt + Passport)
- [x] Schema Completo (15 tabelas + 5 enums)
- [x] Migrations Geradas
- [x] Configuração Environment
- [ ] PostgreSQL Running (próximo passo)
- [ ] APIs CRUD (após banco funcionar)

**67% do Sprint 1 completo!** 🎉 