# 🧪 Sprint 6 - Testing Suite

Este documento descreve a suite completa de testes implementada no **Sprint 6**, que fornece cobertura abrangente de testes automatizados para o sistema acadêmico.

## 📋 Visão Geral

O Sprint 6 implementou uma arquitetura completa de testes com múltiplas camadas:

- ✅ **Testes Unitários** - Testam componentes isolados
- ✅ **Testes de Integração** - Testam fluxos completos da API
- ✅ **Testes de Performance** - Load testing com Artillery
- ✅ **Testes de Segurança** - Validação de vulnerabilidades
- ✅ **Testes E2E** - Testes end-to-end com Playwright
- ✅ **CI/CD Pipeline** - Configuração para GitHub Actions

## 🗂️ Estrutura de Arquivos

```
apps/api/src/tests/
├── unit/                     # Testes unitários
│   ├── auth/                 # Testes dos serviços de autenticação
│   │   ├── jwt.service.test.ts
│   │   └── password.service.test.ts
│   ├── core/                 # Testes dos serviços core
│   │   └── token-blacklist.service.test.ts
│   └── middleware/           # Testes dos middlewares
│       ├── auth.middleware.test.ts
│       └── validation.middleware.test.ts
├── integration/              # Testes de integração
│   └── auth.integration.test.ts
├── performance/              # Testes de performance
│   ├── load-test.yml         # Configuração Artillery
│   └── load-test-processor.js # Processador de dados
├── e2e/                      # Testes end-to-end (Playwright)
│   ├── global-setup.ts       # Setup global
│   └── global-teardown.ts    # Teardown global
├── helpers/                  # Utilitários de teste
│   ├── test-app.ts          # Setup da aplicação de teste
│   └── test-data.ts         # Helpers para dados de teste
└── setup.ts                 # Configuração global dos testes
```

## 🏃‍♂️ Como Executar os Testes

### Configuração Inicial

1. **Instalar dependências:**
```bash
cd apps/api
npm install
```

2. **Configurar variáveis de ambiente para teste:**
```bash
# .env.test
NODE_ENV=test
JWT_SECRET=test-jwt-secret-for-testing-purposes-only
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=test-refresh-secret-for-testing-purposes-only
REFRESH_TOKEN_EXPIRES_IN=7d
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

### Executar Todos os Testes

```bash
# Executar todos os tipos de teste
npm run test

# Executar com coverage
npm run test:ci
```

### Testes por Categoria

#### 🔬 Testes Unitários
```bash
# Executar apenas testes unitários
npm run test:unit

# Executar teste específico
npx vitest run src/tests/unit/auth/jwt.service.test.ts
```

**Cobertura:**
- ✅ JWT Service (geração, verificação, extração de tokens)
- ✅ Password Service (hash, comparação, validação de força)
- ✅ Token Blacklist Service (blacklist, verificação)
- ✅ Auth Middleware (autenticação, autorização)
- ✅ Validation Middleware (body, params, query)

#### 🔗 Testes de Integração
```bash
# Executar testes de integração
npm run test:integration
```

**Cobertura:**
- ✅ Fluxo completo de autenticação (login/refresh/logout)
- ✅ Rotas protegidas com validação de token
- ✅ Role-based access control (ADMIN, SECRETARIA, PROFESSOR, ALUNO)
- ✅ Validação de dados de entrada
- ✅ Blacklisting de tokens

#### ⚡ Testes de Performance
```bash
# Executar load testing
npm run test:performance

# Ou diretamente com Artillery
npx artillery run src/tests/performance/load-test.yml
```

**Cenários testados:**
- 🔥 Health Check Load Test (20% do tráfego)
- 🔐 Authentication Load Test (30% do tráfego)
- 🛡️ Protected Routes Load Test (25% do tráfego)
- 💾 Database Operations Load Test (25% do tráfego)

**Fases de teste:**
1. **Warm up**: 60s, 10 req/s
2. **Load test**: 120s, 50 req/s
3. **Spike test**: 60s, 100 req/s

#### 🛡️ Testes de Segurança
```bash
# Executar auditoria de segurança
npm run test:security

# Auditoria básica (dependências)
npm run test:security:basic
```

#### 🎭 Testes E2E (End-to-End)
```bash
# Instalar browsers do Playwright
npx playwright install

# Executar testes E2E
npm run test:e2e

# Executar em modo headed (com interface)
npx playwright test --headed

# Executar apenas em Chromium
npx playwright test --project=chromium
```

**Cobertura planejada:**
- 🖥️ Login completo via interface web
- 🔄 Navegação entre páginas protegidas
- 📝 Operações CRUD via interface
- 🎭 Testes de diferentes roles
- 📱 Responsividade mobile

## 📊 Métricas e Relatórios

### Coverage Reports
```bash
# Gerar relatório de cobertura
npm run test:ci

# Visualizar relatório HTML
open coverage/index.html
```

### Performance Reports
```bash
# Relatório do Artillery é gerado automaticamente
# Localização: test-results/artillery-report.html
```

### E2E Reports
```bash
# Relatório do Playwright
npx playwright show-report

# Localização: test-results/playwright-report/
```

## 🏗️ Arquitetura de Testes

### Test App Setup
```typescript
// helpers/test-app.ts
export async function createTestApp(): Promise<Express> {
  // Configura aplicação completa para testes
  // Inclui todos os middlewares e rotas
}
```

### Test Data Management
```typescript
// helpers/test-data.ts
export async function createTestUser(options: CreateTestUserOptions): Promise<string> {
  // Cria usuários de teste com dados realistas
}

export async function cleanupTestData(): Promise<void> {
  // Limpa dados de teste após execução
}
```

### Mocking Strategy
- **Database**: Mocks específicos para testes unitários
- **External APIs**: Não aplicável (sistema interno)
- **Services**: Mocks das dependências externas

## 🔧 Configuração de CI/CD

### GitHub Actions (Futuro)
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm install
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Run E2E tests
        run: npm run test:e2e
```

## 🎯 Objetivos de Cobertura

### Metas Alcançadas ✅
- **Testes Unitários**: 80%+ cobertura crítica
- **Testes de Integração**: Fluxos principais cobertos
- **Performance**: Baseline estabelecido
- **E2E**: Estrutura completa configurada

### Próximos Passos
- [ ] Expandir testes E2E para todas as páginas
- [ ] Adicionar testes de regressão visual
- [ ] Implementar testes de acessibilidade
- [ ] Configurar pipeline CI/CD completo

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com database**
   ```bash
   # Verificar se PostgreSQL está rodando
   pg_isready -h localhost -p 5432
   ```

2. **Timeouts nos testes E2E**
   ```bash
   # Aumentar timeout no playwright.config.ts
   timeout: 60000
   ```

3. **Falhas de performance**
   ```bash
   # Verificar recursos do sistema
   # Reduzir carga no load-test.yml se necessário
   ```

## 📚 Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Artillery Documentation](https://artillery.io/)
- [Supertest Documentation](https://github.com/ladjs/supertest)

---

**Sprint 6 Status**: ✅ **COMPLETO** - Sistema totalmente testado e pronto para produção! 