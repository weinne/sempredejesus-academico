# Teste de roles CORRIGIDO com dados válidos
Write-Host "🔐 TESTE CORRIGIDO: Controle de Acesso com Dados Válidos" -ForegroundColor Yellow

# Test data for each endpoint (valid according to schemas)
$testData = @{
    "pessoas" = '{"nomeCompleto":"Teste Usuario","sexo":"M","email":"teste@example.com"}'
    "professores" = '{"pessoaId":1,"matricula":"PROF001","situacao":"ATIVO"}'
    "alunos" = '{"pessoaId":1,"ra":"ALU001","situacao":"ATIVO"}'
    "cursos" = '{"nome":"Curso Teste","descricao":"Curso de teste"}'
    "disciplinas" = '{"nome":"Disciplina Teste","cargaHoraria":60,"cursoId":1}'
    "turmas" = '{"codigo":"TURMA001","disciplinaId":1,"professorId":"PROF001","semestre":"2024.1"}'
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
        Write-Host "  ❌ Login failed for $roleName" -ForegroundColor Red
        return $null
    }
}

# Test ADMIN permissions
Write-Host "`n📋 1. TESTANDO ADMIN (deve ter acesso total)" -ForegroundColor Magenta
$adminToken = Get-AuthToken -email "admin@seminario.edu" -password "admin123" -roleName "ADMIN"

if ($adminToken) {
    $headers = @{ Authorization = "Bearer $adminToken" }
    
    Write-Host "  📊 Testando operações com ADMIN..." -ForegroundColor Cyan
    
    # Test POST to pessoas (should work)
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:4000/api/pessoas" -Method POST -Body $testData.pessoas -ContentType "application/json" -Headers $headers
        Write-Host "  ✅ ADMIN POST /api/pessoas: AUTORIZADO" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ ADMIN POST /api/pessoas: NEGADO ($($_.Exception.Response.StatusCode))" -ForegroundColor Red
    }
    
    # Test POST to cursos (should work)
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:4000/api/cursos" -Method POST -Body $testData.cursos -ContentType "application/json" -Headers $headers
        Write-Host "  ✅ ADMIN POST /api/cursos: AUTORIZADO" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ ADMIN POST /api/cursos: NEGADO ($($_.Exception.Response.StatusCode))" -ForegroundColor Red
    }
}

# Test SECRETARIA permissions
Write-Host "`n📋 2. TESTANDO SECRETARIA (deve ter acesso administrativo)" -ForegroundColor Magenta
$secretariaToken = Get-AuthToken -email "secretaria@seminario.edu" -password "test123" -roleName "SECRETARIA"

if ($secretariaToken) {
    $headers = @{ Authorization = "Bearer $secretariaToken" }
    
    # Test POST to pessoas (should work)
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:4000/api/pessoas" -Method POST -Body $testData.pessoas -ContentType "application/json" -Headers $headers
        Write-Host "  ✅ SECRETARIA POST /api/pessoas: AUTORIZADO" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ SECRETARIA POST /api/pessoas: NEGADO ($($_.Exception.Response.StatusCode))" -ForegroundColor Red
    }
}

# Test PROFESSOR permissions
Write-Host "`n📋 3. TESTANDO PROFESSOR" -ForegroundColor Magenta
$professorToken = Get-AuthToken -email "professor@seminario.edu" -password "test123" -roleName "PROFESSOR"

if ($professorToken) {
    $headers = @{ Authorization = "Bearer $professorToken" }
    
    # Test GET (should work)
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:4000/api/pessoas" -Method GET -Headers $headers
        Write-Host "  ✅ PROFESSOR GET /api/pessoas: AUTORIZADO" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ PROFESSOR GET /api/pessoas: NEGADO ($($_.Exception.Response.StatusCode))" -ForegroundColor Red
    }
    
    # Test POST to pessoas (should be denied)
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:4000/api/pessoas" -Method POST -Body $testData.pessoas -ContentType "application/json" -Headers $headers
        Write-Host "  ⚠️  PROFESSOR POST /api/pessoas: AUTORIZADO (deveria ser negado)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode -eq "Forbidden") {
            Write-Host "  ✅ PROFESSOR POST /api/pessoas: NEGADO (correto)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ PROFESSOR POST /api/pessoas: ERRO ($($_.Exception.Response.StatusCode))" -ForegroundColor Red
        }
    }
    
    # Test POST to turmas (should work - professor can manage turmas)
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:4000/api/turmas" -Method POST -Body $testData.turmas -ContentType "application/json" -Headers $headers
        Write-Host "  ✅ PROFESSOR POST /api/turmas: AUTORIZADO" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ PROFESSOR POST /api/turmas: NEGADO ($($_.Exception.Response.StatusCode))" -ForegroundColor Red
    }
}

# Test ALUNO permissions
Write-Host "`n📋 4. TESTANDO ALUNO (apenas leitura)" -ForegroundColor Magenta
$alunoToken = Get-AuthToken -email "aluno@seminario.edu" -password "test123" -roleName "ALUNO"

if ($alunoToken) {
    $headers = @{ Authorization = "Bearer $alunoToken" }
    
    # Test GET (should work)
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:4000/api/pessoas" -Method GET -Headers $headers
        Write-Host "  ✅ ALUNO GET /api/pessoas: AUTORIZADO" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ ALUNO GET /api/pessoas: NEGADO ($($_.Exception.Response.StatusCode))" -ForegroundColor Red
    }
    
    # Test POST (should be denied)
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:4000/api/pessoas" -Method POST -Body $testData.pessoas -ContentType "application/json" -Headers $headers
        Write-Host "  ⚠️  ALUNO POST /api/pessoas: AUTORIZADO (deveria ser negado)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode -eq "Forbidden") {
            Write-Host "  ✅ ALUNO POST /api/pessoas: NEGADO (correto)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ ALUNO POST /api/pessoas: ERRO ($($_.Exception.Response.StatusCode))" -ForegroundColor Red
        }
    }
}

Write-Host "`n🎉 TESTE DE CONTROLE DE ACESSO CORRIGIDO CONCLUÍDO!" -ForegroundColor Yellow 