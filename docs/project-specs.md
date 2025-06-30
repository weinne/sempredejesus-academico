# Sistema de Gestão Acadêmica - Especificações e Roadmap

## 📋 Visão Geral do Projeto

**Nome**: Sistema de Gestão Acadêmica do Seminário Presbiteriano de Jesus  
**Duração MVP**: 8 semanas  
**Arquitetura**: Monorepo com Turbo Repo  
**Stack Principal**: Express 5 + TypeScript + React 18 + PostgreSQL + Docker  

## ✅ Status Atual - O que já foi implementado

### 🏗️ Infraestrutura Base
- [x] Configuração do monorepo (package.json, turbo.json, pnpm-workspace.yaml)
- [x] Configurações de lint/format (.eslintrc.js, .prettierrc)
- [x] Gitignore configurado
- [x] Docker setup (Dockerfile, docker-compose)
- [x] Documentação inicial (README.md, api-spec.md, rls-policies.md)

### 📦 Shared Packages
- [x] **shared-config**: Logger Winston + tipos base
- [x] **shared-dtos**: Esquemas Zod para todas entidades
- [x] **shared-auth**: Package criado (estrutura básica)
- [x] **shared-tests**: Helpers para testes de componente

### 🔧 Backend API (Parcial)
- [x] Estrutura básica do Express
- [x] Configuração do banco (Drizzle + PostgreSQL)
- [x] Middleware de autenticação e validação
- [x] Factory CRUD genérico
- [x] Rotas de autenticação
- [x] Servidor principal

### 📱 Frontend Portal
- [ ] **Não iniciado ainda**

## 🎯 Roadmap Detalhado - Próximas 8 Semanas

### 📅 Semana 1-2: Finalização do Backend Core

#### 🔐 1. Completar Sistema de Autenticação
**Prioridade**: ALTA  
**Dependências**: shared-auth, shared-dtos  

**Tarefas**:
- [ ] Implementar JWT service em `shared-auth`
- [ ] Criar service de password hashing
- [ ] Implementar estratégia Passport-JWT
- [ ] Criar middleware de autorização por roles
- [ ] Testes unitários para auth

**Entregáveis**:
```
packages/shared-auth/src/
├── jwt.service.ts
├── password.service.ts
├── passport.strategy.ts
├── types.ts
└── index.ts
```

#### 🗄️ 2. Schema Completo do Banco
**Prioridade**: ALTA  
**Dependências**: Análise do dump legado  

**Tarefas**:
- [ ] Criar schema Drizzle completo baseado nos DTOs
- [ ] Implementar todas as tabelas (pessoas, alunos, professores, etc.)
- [ ] Configurar relacionamentos e constraints
- [ ] Criar migrations iniciais
- [ ] Scripts de seed para dados de teste

**Entregáveis**:
```
apps/api/src/db/
├── schema/
│   ├── pessoas.ts
│   ├── alunos.ts
│   ├── professores.ts
│   ├── cursos.ts
│   ├── disciplinas.ts
│   ├── turmas.ts
│   └── index.ts
├── migrations/
└── seed.ts
```

#### 🚀 3. APIs CRUD Completas
**Prioridade**: ALTA  
**Dependências**: Schema do banco, Auth  

**Tarefas**:
- [ ] Implementar todas as rotas CRUD usando o factory
- [ ] Adicionar filtros e paginação
- [ ] Implementar busca textual
- [ ] Middleware de autorização por entidade
- [ ] Validação de dados com Zod

**Entregáveis**:
```
apps/api/src/routes/
├── pessoas.routes.ts
├── alunos.routes.ts
├── professores.routes.ts
├── cursos.routes.ts
├── disciplinas.routes.ts
├── turmas.routes.ts
├── aulas.routes.ts
├── avaliacoes.routes.ts
├── frequencias.routes.ts
└── index.ts
```

### 📅 Semana 3-4: Frontend Foundation

#### ⚛️ 4. Setup Inicial do Portal
**Prioridade**: ALTA  
**Dependências**: Backend API funcionando  

**Tarefas**:
- [ ] Configurar Vite + React 18 + TypeScript
- [ ] Setup Tailwind CSS + shadcn/ui
- [ ] Configurar React Router + layouts
- [ ] Setup TanStack Query + Axios
- [ ] Configurar Zustand para estado global
- [ ] Configurar temas e design tokens

**Entregáveis**:
```
apps/portal/src/
├── components/ui/        # shadcn/ui components
├── layouts/
├── lib/
├── hooks/
├── stores/
├── styles/
└── App.tsx
```

#### 🔐 5. Autenticação Frontend
**Prioridade**: ALTA  
**Dependências**: Setup inicial, Backend auth  

**Tarefas**:
- [ ] Tela de login responsiva
- [ ] Gerenciamento de tokens (localStorage + httpOnly)
- [ ] Rotas protegidas
- [ ] Hook useAuth
- [ ] Interceptors para refresh token
- [ ] Logout automático

**Entregáveis**:
```
apps/portal/src/
├── pages/auth/
│   ├── LoginPage.tsx
│   └── LogoutPage.tsx
├── hooks/useAuth.ts
├── stores/authStore.ts
└── utils/apiClient.ts
```

### 📅 Semana 5-6: Módulos Principais

#### 👥 6. Gestão de Pessoas
**Prioridade**: ALTA  
**Dependências**: Frontend auth, Backend pessoas API  

**Tarefas**:
- [ ] Listagem de pessoas com filtros
- [ ] Formulário de cadastro/edição
- [ ] Upload de foto
- [ ] Busca avançada
- [ ] Exportação de dados
- [ ] Validação de CPF/RG

**Entregáveis**:
```
apps/portal/src/pages/pessoas/
├── PessoasListPage.tsx
├── PessoaFormPage.tsx
├── PessoaDetailPage.tsx
└── components/
    ├── PessoaCard.tsx
    ├── PessoaForm.tsx
    └── PessoaFilters.tsx
```

#### 🎓 7. Gestão de Alunos
**Prioridade**: ALTA  
**Dependências**: Gestão de pessoas, Cursos API  

**Tarefas**:
- [ ] Matrícula de novos alunos
- [ ] Histórico acadêmico
- [ ] Situação acadêmica (ativo, formado, trancado)
- [ ] Relatórios por curso
- [ ] Geração de RA automático

**Entregáveis**:
```
apps/portal/src/pages/alunos/
├── AlunosListPage.tsx
├── AlunoFormPage.tsx
├── AlunoDetailPage.tsx
├── HistoricoPage.tsx
└── components/
```

#### 👨‍🏫 8. Gestão de Professores
**Prioridade**: MÉDIA  
**Dependências**: Gestão de pessoas  

**Tarefas**:
- [ ] Cadastro de professores
- [ ] Formação acadêmica
- [ ] Disciplinas que pode lecionar
- [ ] Horários disponíveis
- [ ] Relatório de carga horária

### 📅 Semana 7: Módulos Acadêmicos

#### 📚 9. Gestão de Cursos e Disciplinas
**Prioridade**: ALTA  
**Dependências**: Professores  

**Tarefas**:
- [ ] CRUD de cursos
- [ ] Grade curricular
- [ ] Pré-requisitos de disciplinas
- [ ] Carga horária
- [ ] Coordenador do curso

#### 🏫 10. Gestão de Turmas
**Prioridade**: ALTA  
**Dependências**: Cursos, Disciplinas, Alunos  

**Tarefas**:
- [ ] Criação de turmas
- [ ] Matrícula em disciplinas
- [ ] Horários das aulas
- [ ] Salas de aula
- [ ] Lista de presença

### 📅 Semana 8: Finalização e Deploy

#### 📊 11. Sistema de Notas e Frequência
**Prioridade**: ALTA  
**Dependências**: Turmas, Avaliações  

**Tarefas**:
- [ ] Lançamento de notas
- [ ] Controle de frequência
- [ ] Cálculo de média
- [ ] Boletim do aluno
- [ ] Atas de nota

#### 🚀 12. Deploy e Monitoramento
**Prioridade**: ALTA  
**Dependências**: Todos os módulos  

**Tarefas**:
- [ ] Configuração de produção
- [ ] Backup automático do banco
- [ ] Logs e monitoramento
- [ ] Testes de carga
- [ ] Documentação de deploy

## 📋 Checklist de Qualidade

### 🧪 Testes
- [ ] Testes unitários para todos os services
- [ ] Testes de integração para APIs
- [ ] Testes E2E para fluxos principais
- [ ] Coverage > 80%

### 🔒 Segurança
- [ ] Validação de inputs
- [ ] Rate limiting
- [ ] CORS configurado
- [ ] Headers de segurança
- [ ] SQL injection prevention
- [ ] XSS protection

### 📱 UX/UI
- [ ] Design responsivo
- [ ] Acessibilidade (WCAG 2.1)
- [ ] Loading states
- [ ] Error boundaries
- [ ] Feedback visual
- [ ] Performance otimizada

### 📚 Documentação
- [ ] README atualizado
- [ ] API documentation
- [ ] Deployment guide
- [ ] User manual
- [ ] Developer guide

## 🛠️ Ferramentas e Scripts Necessários

### Development
```bash
# Setup inicial
pnpm install
pnpm run build
pnpm run dev

# Banco de dados
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed

# Testes
pnpm run test
pnpm run test:e2e
pnpm run test:coverage
```

### Production
```bash
# Build
pnpm run build

# Deploy
docker build -t seminario-app .
docker-compose up -d
```

## 🎯 Próximos Passos Imediatos

1. **Implementar autenticação completa** (shared-auth)
2. **Criar schema completo do banco** (Drizzle)
3. **Finalizar APIs CRUD** (backend)
4. **Iniciar frontend** (React setup)

## ⚠️ Riscos e Considerações

- **Performance**: Monitorar queries N+1 e otimizar com eager loading
- **Segurança**: Implementar RLS no PostgreSQL para isolamento de dados
- **Escalabilidade**: Considerar cache com Redis para consultas frequentes
- **Backup**: Estratégia de backup automático e recovery
- **Monitoramento**: Logs estruturados e alertas para produção 