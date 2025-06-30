# 📊 Progress Tracker - Sistema Acadêmico

## 🎯 Sprint Atual: Backend Core (Semana 1-2)

### 🔐 1. Sistema de Autenticação Completo
**Status**: 🔄 EM PROGRESSO  
**Iniciado**: [Data]  
**Deadline**: [Data]  

#### Subtarefas:
- [ ] **JWT Service** - Criar em `packages/shared-auth/src/jwt.service.ts`
  - [ ] generateToken()
  - [ ] verifyToken()  
  - [ ] refreshToken()
  - [ ] Configuração de expiry
  
- [ ] **Password Service** - Criar em `packages/shared-auth/src/password.service.ts`
  - [ ] hashPassword()
  - [ ] comparePassword()
  - [ ] generateSalt()
  - [ ] Configuração bcrypt
  
- [ ] **Passport Strategy** - Criar em `packages/shared-auth/src/passport.strategy.ts`
  - [ ] JWT Strategy configuração
  - [ ] Extração de payload
  - [ ] Validação de usuário
  
- [ ] **Types & Interfaces** - Criar em `packages/shared-auth/src/types.ts`
  - [ ] User interface
  - [ ] JWT payload interface
  - [ ] Auth response types
  
- [ ] **Main Export** - Atualizar `packages/shared-auth/src/index.ts`
  - [ ] Exportar todos os services
  - [ ] Exportar types
  
- [ ] **Middleware de Autorização** - Atualizar `apps/api/src/middleware/auth.middleware.ts`
  - [ ] Role-based access control
  - [ ] Resource-based permissions
  
- [ ] **Testes Unitários**
  - [ ] JWT service tests
  - [ ] Password service tests
  - [ ] Auth middleware tests

**Bloqueadores**: Nenhum  
**Notas**: Usar bcrypt para hash, JWT com HS256

---

### 🗄️ 2. Schema Completo do Banco
**Status**: ⏳ PENDENTE  
**Dependências**: Análise do dump legado  

#### Subtarefas:
- [ ] **Análise do Dump** - Mapear estrutura atual
  - [ ] Identificar tabelas principais
  - [ ] Mapear relacionamentos
  - [ ] Identificar constraints
  
- [ ] **Schema Base** - Criar em `apps/api/src/db/schema/`
  - [ ] `pessoas.ts` - Tabela principal de pessoas
  - [ ] `alunos.ts` - Extensão para alunos
  - [ ] `professores.ts` - Extensão para professores
  - [ ] `cursos.ts` - Cursos oferecidos
  - [ ] `disciplinas.ts` - Disciplinas do currículo
  - [ ] `turmas.ts` - Turmas por semestre
  - [ ] `aulas.ts` - Aulas ministradas
  - [ ] `avaliacoes.ts` - Avaliações e notas
  - [ ] `frequencias.ts` - Controle de presença
  - [ ] `calendario.ts` - Eventos acadêmicos
  - [ ] `configuracoes.ts` - Configs do sistema
  
- [ ] **Relacionamentos** - Configurar foreign keys
  - [ ] pessoa -> aluno (1:1)
  - [ ] pessoa -> professor (1:1)
  - [ ] curso -> disciplinas (1:N)
  - [ ] disciplina -> turmas (1:N)
  - [ ] turma -> aulas (1:N)
  - [ ] aula -> frequencias (1:N)
  
- [ ] **Migrations** - Scripts de migração
  - [ ] Initial migration
  - [ ] Indexes para performance
  - [ ] Constraints e validations
  
- [ ] **Seed Data** - Dados de teste
  - [ ] Usuários admin
  - [ ] Cursos básicos
  - [ ] Disciplinas de exemplo
  - [ ] Dados de teste

**Bloqueadores**: Nenhum  
**Notas**: Usar UUID para IDs, incluir timestamps

---

### 🚀 3. APIs CRUD Completas  
**Status**: ⏳ PENDENTE  
**Dependências**: Schema do banco, Auth system  

#### Subtarefas:
- [ ] **Rotas Base** - Implementar em `apps/api/src/routes/`
  - [ ] `pessoas.routes.ts`
  - [ ] `alunos.routes.ts` 
  - [ ] `professores.routes.ts`
  - [ ] `cursos.routes.ts`
  - [ ] `disciplinas.routes.ts`
  - [ ] `turmas.routes.ts`
  - [ ] `aulas.routes.ts`
  - [ ] `avaliacoes.routes.ts`
  - [ ] `frequencias.routes.ts`
  
- [ ] **Funcionalidades CRUD**
  - [ ] GET /api/entity (list with pagination)
  - [ ] GET /api/entity/:id (get by id)
  - [ ] POST /api/entity (create)
  - [ ] PUT /api/entity/:id (update)
  - [ ] DELETE /api/entity/:id (delete)
  
- [ ] **Filtros e Busca**
  - [ ] Query parameters para filtros
  - [ ] Busca textual full-text
  - [ ] Ordenação por campos
  - [ ] Paginação (limit/offset)
  
- [ ] **Autorização**
  - [ ] Middleware por role
  - [ ] Permissions por resource
  - [ ] Row-level security
  
- [ ] **Validação**
  - [ ] Request validation com Zod
  - [ ] Business rules validation
  - [ ] Error handling padronizado

**Bloqueadores**: Schema do banco, Auth  
**Notas**: Usar factory CRUD já criado

---

## ✅ Tarefas Completadas

### Infraestrutura ✅
- [x] Setup monorepo com Turbo
- [x] Configuração ESLint/Prettier  
- [x] Docker configuration
- [x] Documentação base

### Shared Packages ✅
- [x] shared-config (logger Winston)
- [x] shared-dtos (esquemas Zod)
- [x] shared-auth (estrutura básica)
- [x] shared-tests (helpers)

### Backend Base ✅  
- [x] Express server setup
- [x] Database connection (Drizzle)
- [x] Auth middleware base
- [x] Validation middleware
- [x] CRUD factory genérico
- [x] Auth routes estrutura

---

## 📅 Próximos Sprints

### Sprint 2: Frontend Foundation (Semana 3-4)
- [ ] React + Vite setup
- [ ] Tailwind + shadcn/ui
- [ ] React Router
- [ ] TanStack Query
- [ ] Auth frontend

### Sprint 3: Módulos Core (Semana 5-6)  
- [ ] Gestão de pessoas
- [ ] Gestão de alunos
- [ ] Gestão de professores

### Sprint 4: Módulos Acadêmicos (Semana 7)
- [ ] Cursos e disciplinas
- [ ] Turmas e matrículas

### Sprint 5: Finalização (Semana 8)
- [ ] Notas e frequência
- [ ] Deploy e produção

---

## 🚨 Bloqueadores Atuais

**Nenhum bloqueador no momento**

---

## 📝 Notas de Desenvolvimento

### Decisões Técnicas
- **IDs**: Usar UUID em vez de auto-increment
- **Timestamps**: Incluir created_at, updated_at em todas as tabelas
- **Soft Delete**: Implementar deleted_at para exclusão lógica
- **Auditoria**: Log de alterações em tabela separada

### Configurações Importantes
- **JWT**: HS256, expiry 1h, refresh 7d
- **Bcrypt**: Rounds = 12
- **Rate Limit**: 100 req/15min
- **CORS**: Apenas domínios autorizados

### Padrões de Código
- **Nomenclatura**: camelCase (JS/TS), snake_case (DB)
- **Validação**: Sempre usar Zod schemas
- **Errors**: Sempre lançar com códigos HTTP corretos
- **Logs**: Estruturados com Winston

---

## 🔄 Atualização de Status

**Última atualização**: [Data a ser preenchida]  
**Próxima reunião**: [Data a ser agendada]  
**Status geral**: 🟡 Em desenvolvimento ativo 