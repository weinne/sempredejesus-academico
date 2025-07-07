# Script para testar fluxo de autenticação
Write-Host "🔐 Testando fluxo completo de autenticação..." -ForegroundColor Yellow

# 1. Login
Write-Host "`n1️⃣ Fazendo login..." -ForegroundColor Cyan
$loginBody = @{ 
    email = "admin@seminario.edu"
    password = "admin123" 
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
        $accessToken = $loginResponse.data.accessToken
        $refreshToken = $loginResponse.data.refreshToken
        
        Write-Host "   Access Token: $($accessToken.Substring(0,50))..." -ForegroundColor Gray
        Write-Host "   Refresh Token: $($refreshToken.Substring(0,50))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ Falha no login: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Teste de endpoint protegido
Write-Host "`n2️⃣ Testando acesso a endpoint protegido..." -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $accessToken" }

try {
    $protectedResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/pessoas" -Method GET -Headers $headers
    
    if ($protectedResponse.success) {
        Write-Host "✅ Acesso autorizado ao endpoint protegido!" -ForegroundColor Green
        Write-Host "   Encontradas $($protectedResponse.data.Count) pessoas" -ForegroundColor Gray
    } else {
        Write-Host "❌ Falha no acesso: $($protectedResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro no acesso protegido: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Teste de refresh token
Write-Host "`n3️⃣ Testando refresh token..." -ForegroundColor Cyan
$refreshBody = @{ refreshToken = $refreshToken } | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json"
    
    if ($refreshResponse.success) {
        Write-Host "✅ Token renovado com sucesso!" -ForegroundColor Green
        $newAccessToken = $refreshResponse.data.accessToken
        Write-Host "   Novo Access Token: $($newAccessToken.Substring(0,50))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ Falha na renovação: $($refreshResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro no refresh: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Teste de logout
Write-Host "`n4️⃣ Testando logout..." -ForegroundColor Cyan
try {
    $logoutResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/logout" -Method POST -Headers $headers
    
    if ($logoutResponse.success) {
        Write-Host "✅ Logout realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha no logout: $($logoutResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro no logout: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Teste de acesso após logout (deve falhar)
Write-Host "`n5️⃣ Testando acesso após logout (deve falhar)..." -ForegroundColor Cyan
try {
    $afterLogoutResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/pessoas" -Method GET -Headers $headers
    Write-Host "❌ PROBLEMA: Ainda conseguiu acessar após logout!" -ForegroundColor Red
} catch {
    Write-Host "✅ Correto: Acesso negado após logout" -ForegroundColor Green
}

Write-Host "`n🎉 Teste de autenticação concluído!" -ForegroundColor Yellow 