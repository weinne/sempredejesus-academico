# Script de configuração automática do ambiente de desenvolvimento (PowerShell)
# Este script configura o banco de dados após o Docker estar rodando

$ErrorActionPreference = "Stop"

Write-Host "🚀 Configurando ambiente de desenvolvimento..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o Docker está rodando
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verificar se o container do banco está rodando
$containerRunning = docker ps --filter "name=seminario_db_dev" --format "{{.Names}}"

if (-not $containerRunning) {
    Write-Host "📦 Iniciando container do PostgreSQL..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml up -d db
    
    Write-Host "⏳ Aguardando PostgreSQL estar pronto..." -ForegroundColor Yellow
    $timeout = 60
    $counter = 0
    while ($true) {
        try {
            docker exec seminario_db_dev pg_isready -U postgres 2>&1 | Out-Null
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

# Verificar se o schema já foi aplicado
Write-Host ""
Write-Host "🔍 Verificando se o schema já foi aplicado..." -ForegroundColor Cyan

try {
    $tables = docker exec seminario_db_dev psql -U postgres -d seminario_db -t -c "\dt" 2>$null
    if ($tables -match "pessoas") {
        Write-Host "⚠️  Schema já existe no banco de dados" -ForegroundColor Yellow
        $response = Read-Host "Deseja reaplicar o schema? (s/N)"
        if ($response -ne "s" -and $response -ne "S") {
            Write-Host "Pulando aplicação do schema..."
            $skipSchema = $true
        }
    }
} catch {
    # Schema não existe, continuar
}

# Aplicar schema se necessário
if (-not $skipSchema) {
    Write-Host ""
    Write-Host "📊 Aplicando schema do banco de dados..." -ForegroundColor Cyan
    Push-Location apps/api
    pnpm run db:push
    Pop-Location
    Write-Host "✅ Schema aplicado com sucesso!" -ForegroundColor Green
}

# Informações finais
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "✅ Ambiente de desenvolvimento configurado!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
Write-Host "📋 Informações de conexão:" -ForegroundColor Cyan
Write-Host "   Host: localhost"
Write-Host "   Porta: 5432"
Write-Host "   Database: seminario_db"
Write-Host "   Usuário: postgres"
Write-Host "   Senha: passwd"
Write-Host ""
Write-Host "🔗 URLs úteis:" -ForegroundColor Cyan
Write-Host "   Adminer (GUI): http://localhost:8080"
Write-Host "   pgAdmin (GUI avançado): http://localhost:5050 (use --profile tools)"
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Configure as variáveis de ambiente no arquivo .env"
Write-Host "   2. Execute: pnpm dev"
Write-Host "   3. Os usuários de teste serão criados automaticamente em desenvolvimento"
Write-Host ""
Write-Host "💡 Dica: Use 'docker compose -f docker-compose.dev.yml logs -f db' para ver logs do PostgreSQL" -ForegroundColor Yellow
Write-Host ""

