# Sistema de Gestão Acadêmica - Seminário Presbiteriano de Jesus

Sistema completo de gestão acadêmica desenvolvido para substituir o sistema legado, oferecendo uma solução moderna e completa para administração de alunos, professores, cursos, turmas e avaliações.

## 🏗️ Arquitetura e Tech Stack

### Monorepo Structure (Turbo Repo + pnpm)

```
sempredejesus-academico/
├── apps/
│   ├── api/           # Backend API (Express 5 + TypeScript)
│   └── portal/        # Frontend SPA (React 18 + Vite)
├── packages/
│   ├── shared-config/ # Configurações centralizadas (dotenv-flow + Winston)
│   ├── shared-dtos/   # DTOs e validações (Zod)
│   ├── shared-auth/   # Utilitários de autenticação (Passport-JWT)
│   └── shared-tests/  # Helpers para testes (Vitest)
└── docs/              # Documentação
```

### Backend (API)
- **Framework:** Express 5 + TypeScript
- **Database:** PostgreSQL 15 + Drizzle ORM
- **Autenticação:** JWT (HS256) + Refresh Tokens
- **Segurança:** Row-Level Security (RLS), Rate Limiting, Helmet
- **Documentação:** Swagger auto-gerado (zod-to-openapi)
- **Upload:** Multer para arquivos
- **CRUD:** Factory pattern para operações automáticas

### Frontend (Portal)
- **Framework:** React 18 + Vite + TypeScript
- **Estilização:** Tailwind CSS + shadcn/ui
- **Estado:** TanStack Query + Zustand
- **Roteamento:** React Router v6 (SPA)
- **Formulários:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Tema:** Design system com tokens customizados

### DevOps e Infraestrutura
- **Containerização:** Docker multi-stage
- **Orquestração:** Docker Compose
- **Deploy:** Coolify ready
- **CI/CD:** GitHub Actions (Husky + commitlint)
- **Qualidade:** ESLint + Prettier + TypeScript strict
- **Testes:** Vitest (≥60% coverage)

## 🚀 Setup Local

### Pré-requisitos

- Node.js ≥18.0.0
- pnpm ≥8.0.0
- Docker e Docker Compose
- PostgreSQL 15 (ou via Docker)

### 1. Instalação

```bash
# Clonar o repositório
git clone <repository-url>
cd sempredejesus-academico

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações
```

### 2. Banco de Dados

#### Opção A: Docker (Recomendado)
```bash
# Subir apenas o banco para desenvolvimento
docker-compose -f docker-compose.dev.yml up db -d

# Verificar se está rodando
docker-compose -f docker-compose.dev.yml ps
```

#### Opção B: PostgreSQL Local
```bash
# Criar banco de dados
createdb seminario_db

# Importar dados iniciais (opcional)
psql seminario_db < Dump20180203.sql
```

### 3. Desenvolvimento

```bash
# Executar migrações do banco
pnpm db:push

# Seed dados iniciais (opcional)
pnpm db:seed

# Iniciar desenvolvimento (API + Portal)
pnpm dev
```

Após inicialização:
- **API:** http://localhost:4000
- **Portal:** http://localhost:3000
- **API Docs:** http://localhost:4000/docs
- **Adminer:** http://localhost:8080 (se usando Docker)

### 4. Build para Produção

```bash
# Build completo
pnpm build

# Testar build localmente
docker-compose up
```

## 📚 Scripts Úteis

```bash
# Desenvolvimento
pnpm dev              # Inicia API + Portal em modo dev
pnpm dev:api          # Apenas API
pnpm dev:portal       # Apenas Portal

# Build e Deploy
pnpm build            # Build completo (todos os pacotes)
pnpm build:api        # Build apenas API
pnpm build:portal     # Build apenas Portal

# Qualidade de Código
pnpm lint             # ESLint em todo o projeto
pnpm format           # Prettier em todo o projeto
pnpm typecheck        # TypeScript check

# Testes
pnpm test             # Testes em modo watch
pnpm test:ci          # Testes com coverage

# Banco de Dados
pnpm db:push          # Aplicar mudanças do schema
pnpm db:migrate       # Gerar e executar migrations
pnpm db:seed          # Popular dados iniciais
pnpm db:studio        # Drizzle Studio (GUI)
```

## 🏛️ Estrutura do Banco de Dados

### Entidades Principais

- **pessoas** - Dados pessoais base
- **alunos** - Informações acadêmicas dos estudantes
- **professores** - Dados dos docentes
- **cursos** - Cursos oferecidos
- **disciplinas** - Matérias de cada curso
- **semestres** - Períodos letivos
- **turmas** - Classes específicas de disciplinas
- **aulas** - Registros de aulas ministradas
- **avaliacoes** - Provas, trabalhos e atividades
- **frequencias** - Controle de presença
- **calendario** - Eventos acadêmicos
- **configuracoes** - Configurações do sistema

### Autenticação e Autorização

**Roles disponíveis:**
- `ADMIN` - Acesso total ao sistema
- `SECRETARIA` - Gestão acadêmica completa
- `PROFESSOR` - Acesso às suas turmas e avaliações
- `ALUNO` - Portal do aluno (histórico, notas, frequência)

**Row-Level Security (RLS):**
- Alunos acessam apenas seus próprios dados
- Professores gerenciam apenas suas turmas
- Secretaria tem acesso geral aos dados acadêmicos
- Admin possui controle total

## 🔧 Configuração e Personalização

### Variáveis de Ambiente

Principais configurações em `.env`:

```bash
# Banco de Dados
DATABASE_URL="postgresql://user:pass@localhost:5432/seminario_db"

# Autenticação
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

# Servidor
PORT=4000
NODE_ENV="development"
APP_URL="http://localhost:3000"
API_URL="http://localhost:4000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100
```

### Customização do Tema

O sistema utiliza design tokens CSS customizáveis:

- **Cor Primária:** Indigo 600 (`--primary`)
- **Cor Secundária:** Amber 400 (`--secondary`)
- **Fonte:** Inter (`font-family`)

Edite `apps/portal/src/globals.css` para personalizar.

## 🧪 Testes

### Estrutura de Testes

```bash
# Unitários (≥60% coverage)
packages/*/src/**/*.test.ts

# Integração API
apps/api/src/**/*.test.ts

# Frontend (React Testing Library)
apps/portal/src/**/*.test.tsx
```

### Executar Testes

```bash
# Todos os testes
pnpm test

# Com coverage
pnpm test:ci

# Testes específicos
pnpm --filter @seminario/api test
pnpm --filter @seminario/portal test
```

## 🚢 Deploy e Produção

### Docker

```bash
# Build da imagem
docker build -t seminario-academico .

# Deploy com Docker Compose
docker-compose up -d
```

### Coolify

O projeto está configurado para deploy automático no Coolify:

1. Configure as variáveis de ambiente no Coolify
2. Conecte ao repositório Git
3. O deploy será automático via `docker-compose.yml`

### Healthchecks

- **API:** `GET /health` - Status detalhado
- **Readiness:** `GET /health/ready` - Pronto para tráfego
- **Liveness:** `GET /health/live` - Aplicação viva

## 📖 Documentação Adicional

- [`docs/api-spec.md`](./docs/api-spec.md) - Especificação da API
- [`docs/rls-policies.md`](./docs/rls-policies.md) - Políticas de segurança
- [`docs/migrations.md`](./docs/migrations.md) - Guia de migrations

## 🔄 Fluxo de Desenvolvimento

### Git Workflow

```bash
# Feature branch
git checkout -b feat/nova-funcionalidade

# Commits convencionais
git commit -m "feat: adiciona cadastro de alunos"
git commit -m "fix: corrige validação de CPF"

# Push e Pull Request
git push origin feat/nova-funcionalidade
```

### Convenções de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

### Ambientes

- **Development:** `pnpm dev` (local)
- **Staging:** Deploy automático via Coolify
- **Production:** Tags de release via Coolify

## 🆘 Troubleshooting

### Problemas Comuns

**1. Erro de conexão com banco:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.dev.yml ps

# Logs do banco
docker-compose -f docker-compose.dev.yml logs db
```

**2. Erro de build:**
```bash
# Limpar cache do Turbo
pnpm turbo clean

# Reinstalar dependências
rm -rf node_modules
pnpm install
```

**3. Erro de TypeScript:**
```bash
# Verificar tipos
pnpm typecheck

# Rebuild dos pacotes
pnpm build
```

## 📄 Licença

Este projeto é propriedade do Seminário Presbiteriano de Jesus.

## 👥 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de TI do seminário.

---

**Desenvolvido para o Seminário Presbiteriano de Jesus** | MVP concluído em 8 semanas 🎯 