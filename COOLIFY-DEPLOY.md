# 🚀 Guia de Deploy no Coolify - Sistema Acadêmico (Nixpacks)

## 📋 Configuração Simplificada com Nixpacks

O projeto agora está configurado para usar **Nixpacks** que é mais simples e tem suporte nativo no Coolify.

## 📦 Configuração no Coolify

### 1. Criar PostgreSQL Service
- **Service Type**: PostgreSQL 15
- **Database Name**: `seminario_db` 
- **Username**: `postgres`
- **Password**: gerar senha segura (anotar para usar no DATABASE_URL)

### 2. Criar Nova Aplicação
- **Source**: Repository GitHub/GitLab
- **Build Pack**: **Nixpacks** (detectado automaticamente)
- **Port**: `4000`
- **Health Check Path**: `/health`

### 3. Environment Variables
Configure na interface do Coolify (Application > Environment Variables):

```bash
# Database (OBRIGATÓRIO)
DATABASE_URL=postgresql://postgres:SUA_SENHA@postgresql-service:5432/seminario_db

# Authentication (GERAR CHAVES SEGURAS)
JWT_SECRET=sua-chave-jwt-256-bits-segura
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=sua-chave-refresh-256-bits-segura

# Application
NODE_ENV=production
PORT=4000
APP_URL=https://seudominio.com
API_URL=https://api.seudominio.com

# Security (Opcional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## � Arquivos de Configuração Criados

- ✅ `nixpacks.toml` - Configuração principal do Nixpacks
- ✅ `scripts/nixpacks-start.sh` - Script de inicialização com migrações
- ✅ `apps/api/src/scripts/migrate-production.ts` - Script de migração

## 🚀 Processo de Deploy (Automático)

1. **Detecção**: Coolify detecta Nixpacks automaticamente
2. **Build**: Instala dependências e builda o projeto
3. **Migrations**: Script aguarda banco e executa migrações
4. **Start**: Inicia aplicação na porta 4000
5. **Health Check**: Verifica `/health` endpoint

## ✅ Vantagens do Nixpacks vs Docker

- ✅ **Mais simples** - Sem Dockerfile complexo
- ✅ **Detecção automática** - Coolify reconhece o projeto
- ✅ **Otimizado** - Build mais rápido
- ✅ **Menos configuração** - Funciona out-of-the-box
- ✅ **Mesmo resultado** - Migrações automáticas mantidas

## 🎯 Deploy Steps

1. **Push** o código para seu repositório
2. **Criar PostgreSQL** service no Coolify
3. **Criar aplicação** no Coolify (vai detectar Nixpacks)
4. **Configurar environment variables** (principalmente DATABASE_URL)
5. **Deploy** - Tudo automático!

## 🔍 Verificação Pós-Deploy

- **API Health**: `https://seudominio.com/health`
- **Database Status**: `https://seudominio.com/health/database`  
- **API Docs**: `https://seudominio.com/api-docs`
- **Logs**: Interface do Coolify

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check logs no Coolify
# Verificar se DATABASE_URL está correto
# Verificar se PostgreSQL service está rodando
```

### Build Issues
```bash
# Nixpacks logs estarão visíveis no Coolify
# Verificar se pnpm-lock.yaml está commitado
```

## � Ready to Deploy!

O projeto está **100% configurado** para Nixpacks + Coolify. Apenas configure as environment variables e faça o deploy!
