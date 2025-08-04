# 🚀 Guia de Deploy no Coolify - Sistema Acadêmico

## 📋 Configuração de Environment Variables

Configure estas variáveis no Coolify (Application > Environment Variables):

### 🗄️ Database
```bash
DATABASE_URL=postgresql://username:password@host:5432/seminario_db
```

### 🔐 Authentication
```bash
JWT_SECRET=your-production-jwt-secret-256-bits-minimum
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret-256-bits-minimum
```

### 🌐 Application
```bash
NODE_ENV=production
PORT=4000
APP_URL=https://seudominio.com
API_URL=https://api.seudominio.com
```

### 🛡️ Security (Opcional)
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📦 Configuração no Coolify

### 1. Criar PostgreSQL Service
- Service Type: PostgreSQL
- Database Name: `seminario_db` 
- Username: `postgres`
- Password: gerar senha segura

### 2. Configuração da Aplicação
- **Source**: Repository GitHub/GitLab
- **Build Type**: Docker
- **Port**: 4000
- **Health Check Path**: `/health`

### 3. Variables de Ambiente
Configurar as variáveis listadas acima na interface do Coolify.

## 🔄 Processo de Deploy

1. **Build**: Coolify constrói a imagem Docker
2. **Migration**: Script automático executa migrações do banco
3. **Start**: Aplicação inicia na porta 4000
4. **Health Check**: Verifica se aplicação está rodando

## ✅ Verificação Pós-Deploy

- **Health Check**: `https://seudominio.com/health`
- **API Docs**: `https://seudominio.com/api-docs`
- **Database Status**: `https://seudominio.com/health/database`

## 🐛 Troubleshooting

### Erro de Conexão com Banco
```bash
# Verificar logs no Coolify
# Endpoint de verificação
curl https://api.seudominio.com/health/database
```

### Migrations não Executaram
```bash
# Conectar ao container via Coolify terminal
cd apps/api
pnpm run migrate:prod
```

## 🎯 Features Incluídas

- ✅ **Auto-migrations** na inicialização
- ✅ **Health checks** configurados  
- ✅ **Production optimized** Dockerfile
- ✅ **Security headers** via Helmet
- ✅ **Rate limiting** configurado
- ✅ **CORS** configurado para produção
- ✅ **Compression** habilitada
- ✅ **SSL/HTTPS** ready
