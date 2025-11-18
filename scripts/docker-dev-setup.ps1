# Script completo de setup do ambiente de desenvolvimento com Docker (PowerShell)
# Este script configura tudo automaticamente: Docker, PostgreSQL, Schema e Usuários

$ErrorActionPreference = "Stop"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 Setup Completo do Ambiente de Desenvolvimento" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Verificar pré-requisitos
Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Blue

try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Docker não está instalado ou não está rodando." -ForegroundColor Red
    Write-Host "   Por favor, instale o Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

try {
    pnpm --version | Out-Null
} catch {
    Write-Host "❌ pnpm não está instalado." -ForegroundColor Red
    Write-Host "   Instale com: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Pré-requisitos verificados" -ForegroundColor Green
Write-Host ""

# Verificar se o arquivo .env existe
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Arquivo .env não encontrado" -ForegroundColor Yellow
    Write-Host "   Criando arquivo .env a partir do template..." -ForegroundColor Yellow
    
    @"
# Database
DATABASE_URL="postgresql://postgres:passwd@localhost:5432/seminario_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-change-in-production"

# Server
PORT=4000
NODE_ENV="development"
APP_URL="http://localhost:3001"
API_URL="http://localhost:4000"

# Upload
UPLOAD_MAX_SIZE="5mb"
UPLOAD_PATH="./uploads"

# Rate Limit
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host "✅ Arquivo .env criado" -ForegroundColor Green
    Write-Host "💡 Revise o arquivo .env e ajuste as configurações se necessário" -ForegroundColor Yellow
    Write-Host ""
}

# Iniciar PostgreSQL
Write-Host "📦 Configurando PostgreSQL..." -ForegroundColor Blue

$containerRunning = docker ps --filter "name=seminario_db_dev" --format "{{.Names}}"

if (-not $containerRunning) {
    Write-Host "   Iniciando container PostgreSQL..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml up -d db
    
    Write-Host "⏳ Aguardando PostgreSQL estar pronto..." -ForegroundColor Yellow
    $timeout = 60
    $counter = 0
    while ($true) {
        try {
            docker exec seminario_db_dev pg_isready -U postgres -d seminario_db 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                break
            }
        } catch {
            # Continua tentando
        }
        
        Start-Sleep -Seconds 2
        $counter += 2
        Write-Host "." -NoNewline
        
        if ($counter -ge $timeout) {
            Write-Host ""
            Write-Host "❌ Timeout aguardando PostgreSQL ficar pronto" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host ""
    Write-Host "✅ PostgreSQL está pronto!" -ForegroundColor Green
} else {
    Write-Host "✅ Container PostgreSQL já está rodando" -ForegroundColor Green
}

# Instalar dependências
Write-Host ""
Write-Host "📦 Instalando dependências..." -ForegroundColor Blue
pnpm install
Write-Host "✅ Dependências instaladas" -ForegroundColor Green

# Verificar se o schema já foi aplicado
Write-Host ""
Write-Host "🔍 Verificando schema do banco de dados..." -ForegroundColor Blue

$schemaExists = $false
try {
    $tables = docker exec seminario_db_dev psql -U postgres -d seminario_db -t -c "\dt" 2>$null
    if ($tables -match "pessoas") {
        $schemaExists = $true
    }
} catch {
    # Schema não existe, continuar
}

if ($schemaExists) {
    Write-Host "⚠️  Schema já existe no banco de dados" -ForegroundColor Yellow
    $response = Read-Host "   Deseja reaplicar o schema? (s/N)"
    if ($response -ne "s" -and $response -ne "S") {
        Write-Host "   Pulando aplicação do schema..." -ForegroundColor Yellow
        $skipSchema = $true
    }
}

# Aplicar schema se necessário
if (-not $skipSchema) {
    Write-Host ""
    Write-Host "📊 Aplicando schema do banco de dados..." -ForegroundColor Blue
    Push-Location apps/api
    pnpm run db:push
    Pop-Location
    Write-Host "✅ Schema aplicado com sucesso!" -ForegroundColor Green
}

# Informações finais
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Ambiente de desenvolvimento configurado com sucesso!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Informações de Conexão:" -ForegroundColor Blue
Write-Host "   Host: localhost"
Write-Host "   Porta: 5432"
Write-Host "   Database: seminario_db"
Write-Host "   Usuário: postgres"
Write-Host "   Senha: passwd"
Write-Host ""
Write-Host "🔗 URLs Úteis:" -ForegroundColor Blue
Write-Host "   Portal (Frontend): http://localhost:3001"
Write-Host "   API: http://localhost:4000"
Write-Host "   API Docs: http://localhost:4000/docs"
Write-Host "   Adminer (GUI DB): http://localhost:8080 (use --profile tools)"
Write-Host "   pgAdmin (GUI DB): http://localhost:5050 (use --profile tools)"
Write-Host ""
Write-Host "📝 Próximos Passos:" -ForegroundColor Blue
Write-Host "   1. Execute: " -NoNewline
Write-Host "pnpm dev" -ForegroundColor Green
Write-Host "   2. Os usuários de teste serão criados automaticamente"
Write-Host "   3. Acesse o portal em http://localhost:3001"
Write-Host ""
Write-Host "💡 Dicas:" -ForegroundColor Yellow
Write-Host "   - Ver logs do PostgreSQL: " -NoNewline
Write-Host "pnpm docker:dev:logs" -ForegroundColor Cyan
Write-Host "   - Parar containers: " -NoNewline
Write-Host "pnpm docker:dev:down" -ForegroundColor Cyan
Write-Host "   - Iniciar ferramentas (Adminer/pgAdmin): " -NoNewline
Write-Host "pnpm docker:dev:tools" -ForegroundColor Cyan
Write-Host "   - Drizzle Studio: " -NoNewline
Write-Host "pnpm db:studio" -ForegroundColor Cyan
Write-Host ""

