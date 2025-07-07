# Teste avançado de controle de acesso baseado em roles
Write-Host "🔐 TESTE AVANÇADO: Controle de Acesso Baseado em Roles" -ForegroundColor Yellow

# Credentials for all test users
$users = @{
    "ADMIN" = @{ email = "admin@seminario.edu"; password = "admin123" }
    "SECRETARIA" = @{ email = "secretaria@seminario.edu"; password = "test123" }
    "PROFESSOR" = @{ email = "professor@seminario.edu"; password = "test123" }
    "ALUNO" = @{ email = "aluno@seminario.edu"; password = "test123" }
}

# Test endpoints and their expected permissions
$endpoints = @{
    "/api/pessoas" = @{
        GET = @("ADMIN", "SECRETARIA", "PROFESSOR", "ALUNO")  # All can read
        POST = @("ADMIN", "SECRETARIA")                        # Only ADMIN/SECRETARIA can create
        PATCH = @("ADMIN", "SECRETARIA")                       # Only ADMIN/SECRETARIA can update
        DELETE = @("ADMIN", "SECRETARIA")                      # Only ADMIN/SECRETARIA can delete
    }
    "/api/professores" = @{
        GET = @("ADMIN", "SECRETARIA", "PROFESSOR", "ALUNO")
        POST = @("ADMIN", "SECRETARIA")
        PATCH = @("ADMIN", "SECRETARIA")
        DELETE = @("ADMIN", "SECRETARIA")
    }
    "/api/alunos" = @{
        GET = @("ADMIN", "SECRETARIA", "PROFESSOR", "ALUNO")
        POST = @("ADMIN", "SECRETARIA")
        PATCH = @("ADMIN", "SECRETARIA")
        DELETE = @("ADMIN", "SECRETARIA")
    }
    "/api/cursos" = @{
        GET = @("ADMIN", "SECRETARIA", "PROFESSOR", "ALUNO")
        POST = @("ADMIN", "SECRETARIA")
        PATCH = @("ADMIN", "SECRETARIA")
        DELETE = @("ADMIN", "SECRETARIA")
    }
    "/api/disciplinas" = @{
        GET = @("ADMIN", "SECRETARIA", "PROFESSOR", "ALUNO")
        POST = @("ADMIN", "SECRETARIA")
        PATCH = @("ADMIN", "SECRETARIA")
        DELETE = @("ADMIN", "SECRETARIA")
    }
    "/api/turmas" = @{
        GET = @("ADMIN", "SECRETARIA", "PROFESSOR", "ALUNO")
        POST = @("ADMIN", "SECRETARIA", "PROFESSOR")           # PROFESSOR can also manage turmas
        PATCH = @("ADMIN", "SECRETARIA", "PROFESSOR")
        DELETE = @("ADMIN", "SECRETARIA", "PROFESSOR")
    }
}

# Function to get auth token
function Get-AuthToken {
    param($email, $password, $roleName)
    
    try {
        $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
        
        if ($response.success) {
            return $response.data.accessToken
        }
        return $null
    } catch {
        Write-Host "    ❌ Login failed for $roleName" -ForegroundColor Red
        return $null
    }
}

# Function to test access
function Test-Access {
    param($token, $endpoint, $method, $roleName, $expectedAllowed)
    
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "http://localhost:4000$endpoint" -Method $method -Headers $headers
        
        if ($expectedAllowed) {
            Write-Host "      ✅ $roleName $method $endpoint : AUTORIZADO" -ForegroundColor Green
            return $true
        } else {
            Write-Host "      ⚠️  $roleName $method $endpoint : AUTORIZADO (deveria ser negado)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        if (-not $expectedAllowed) {
            Write-Host "      ✅ $roleName $method $endpoint : NEGADO (correto)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "      ❌ $roleName $method $endpoint : NEGADO (deveria ser autorizado)" -ForegroundColor Red
            return $false
        }
    }
}

# Statistics
$totalTests = 0
$passedTests = 0

# Get tokens for all users
Write-Host "`n📋 1. FAZENDO LOGIN PARA TODOS OS USUÁRIOS" -ForegroundColor Magenta
$tokens = @{}

foreach ($role in $users.Keys) {
    $user = $users[$role]
    Write-Host "  🔑 Fazendo login como $role..." -ForegroundColor Cyan
    $token = Get-AuthToken -email $user.email -password $user.password -roleName $role
    
    if ($token) {
        $tokens[$role] = $token
        Write-Host "    ✅ Login $role realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "    ❌ Falha no login $role" -ForegroundColor Red
    }
}

# Test all combinations
Write-Host "`n📋 2. TESTANDO PERMISSÕES GRANULARES" -ForegroundColor Magenta

foreach ($endpoint in $endpoints.Keys) {
    Write-Host "`n  📊 Testando endpoint: $endpoint" -ForegroundColor Cyan
    
    foreach ($method in @("GET", "POST", "PATCH", "DELETE")) {
        if ($endpoints[$endpoint][$method]) {
            Write-Host "    🔍 Método: $method" -ForegroundColor Yellow
            $allowedRoles = $endpoints[$endpoint][$method]
            
            foreach ($role in $users.Keys) {
                $totalTests++
                $token = $tokens[$role]
                
                if ($token) {
                    $shouldBeAllowed = $allowedRoles -contains $role
                    $result = Test-Access -token $token -endpoint $endpoint -method $method -roleName $role -expectedAllowed $shouldBeAllowed
                    
                    if ($result) {
                        $passedTests++
                    }
                }
            }
        }
    }
}

# Summary
Write-Host "`n📋 3. RESUMO DOS TESTES" -ForegroundColor Magenta
Write-Host "  📊 Total de testes: $totalTests" -ForegroundColor White
Write-Host "  ✅ Testes passou: $passedTests" -ForegroundColor Green
Write-Host "  ❌ Testes falhou: $($totalTests - $passedTests)" -ForegroundColor Red

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 2)
Write-Host "  📈 Taxa de sucesso: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })

Write-Host "`n🎉 TESTE DE CONTROLE DE ACESSO BASEADO EM ROLES CONCLUÍDO!" -ForegroundColor Yellow

if ($successRate -eq 100) {
    Write-Host "🏆 PERFEITO! Todos os controles de acesso estão funcionando corretamente!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Alguns controles de acesso precisam de ajustes." -ForegroundColor Yellow
} 