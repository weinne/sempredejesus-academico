# AGENTS.md - Sistema de Gestão Acadêmica

**Guia Técnico para Agentes de IA** – Este documento serve como referência completa para entender, desenvolver e manter o Sistema de Gestão Acadêmica.

## Sumário Rápido
- 🎯 [Visão Geral](#visao-geral)
- 🏗️ [Arquitetura e Stack](#arquitetura-e-stack)
- 🗄️ [Banco de Dados](#banco-de-dados)
- 📡 [APIs](#apis)
- 🖥️ [Frontend Portal](#frontend-portal)
- 🛠️ [Desenvolvimento](#desenvolvimento)
- ⚙️ [Operações](#operacoes)
- 🔐 [Segurança e Performance](#seguranca-e-performance)
- 🚀 [Roadmap Futuro](#roadmap-futuro)
- 🆘 [Suporte e Debug](#suporte-e-debug)
- 📚 [Referências](#referencias)
- ✅ [Status Atual](#status-atual)

<a id="visao-geral"></a>
## 🎯 Visão Geral

- **Status**: ✅ Production-ready – Sprint 7 concluída com todas as interfaces CRUD entregues.
- **Escopo**: Monorepo full-stack para gestão acadêmica com backend Express/TypeScript, frontend React/Vite e PostgreSQL 15.
- **Perfis de usuário**: ADMIN, SECRETARIA, PROFESSOR e ALUNO com permissões granulares.
- **Deploy alvo**: Coolify (Docker) com monitoramento e métricas prontas.

### Métricas Atuais
- 🗄️ 17 tabelas PostgreSQL relacionais
- 📡 8 endpoints CRUD + autenticação
- 👥 4 roles com controle de acesso
- 📱 15+ páginas funcionais no portal
- 🧪 76 testes unitários passando
- 🔒 Security enterprise-grade (JWT, rate limiting, headers)

<a id="arquitetura-e-stack"></a>
## 🏗️ Arquitetura e Stack

### Stack Principal
- **Backend**: Express 5, TypeScript, Drizzle ORM, PostgreSQL 15
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Radix UI (shadcn/ui)
- **Autenticação**: JWT + Passport + bcrypt com blacklist de tokens
- **APIs**: RESTful com OpenAPI 3.0 e validação via Zod
- **Deploy**: Docker + Coolify, pronto para produção

### Estrutura do Monorepo
```
apps/
├── api/
│   └── src/
│       ├── core/          # Serviços JWT, bcrypt, blacklist
│       ├── db/            # Schema, migrations e seed
│       ├── middleware/    # Auth, validação, rate limiting
│       ├── routes/        # 8+ endpoints CRUD
│       ├── config/        # Swagger, logger, database
│       └── server.ts      # Bootstrap com monitoring
├── portal/
│   └── src/
│       ├── components/    # shadcn/ui + componentes reutilizáveis
│       ├── pages/         # 15+ páginas funcionais
│       ├── providers/     # AuthProvider, contextos
│       ├── services/      # API client + React Query
│       └── types/         # Tipagens compartilhadas
packages/
├── shared-auth/           # Serviços de auth reutilizáveis
├── shared-config/         # Logger, env e utilidades
├── shared-dtos/           # DTOs + schemas Zod
└── shared-tests/          # Helpers Vitest/Playwright
docs/                      # Documentação detalhada
```

<a id="banco-de-dados"></a>
## 🗄️ Banco de Dados

### Resumo do Schema
- 17 tabelas relacionais modelando pessoas, acadêmico e operações.
- 5 enums (`user_role`, `situacao_aluno`, `situacao_professor`, `tipo_avaliacao`, `status_inscricao`).
- Relacionamentos prontos para joins Drizzle; diagramas em `docs/database-setup.md`.

### Tabelas por Domínio
**Entidades centrais**
```
pessoas(id, nome, sexo, cpf, email, telefone, endereco, data_nascimento)
users(id, pessoa_id, username, role, is_active, last_login)
configuracoes(id, chave, valor, descricao)
```

**Estrutura acadêmica**
```
turnos(id, nome)
curriculos(id, curso_id, turno_id, versao, vigente_de, vigente_ate, ativo)
coortes(id, curso_id, turno_id, curriculo_id, ano_ingresso, rotulo, ativo)
periodos(id, curso_id, turno_id, curriculo_id, numero, nome, descricao, data_inicio, data_fim)
```

**Entidades acadêmicas**
```
cursos(id, nome, grau)
disciplinas(id, curso_id, periodo_id, codigo, nome, creditos, carga_horaria, ementa, bibliografia, ativo)
alunos(ra, pessoa_id, curso_id, turno_id, coorte_id, periodo_id, ano_ingresso, igreja, situacao, coeficiente_acad)
professores(matricula, pessoa_id, data_inicio, formacao_acad, situacao)
turmas(id, disciplina_id, professor_id, coorte_id, sala, horario, secao)
calendario(id, periodo_id, evento, inicio, termino, obs)
```

**Operações acadêmicas**
```
turmas_inscritos(id, turma_id, aluno_id, status, media, frequencia)
aulas(id, turma_id, data, topico, material_url, observacao)
avaliacoes(id, turma_id, data, tipo, codigo, descricao, peso, arquivo_url)
avaliacoes_alunos(id, avaliacao_id, inscricao_id, nota, obs)
frequencias(id, aula_id, inscricao_id, presente, justificativa)
blacklisted_tokens(id, token, expires_at)
```

<a id="apis"></a>
## 📡 APIs

- **Base URL**: `http://localhost:4000/api`
- Documentação interativa via Swagger: `http://localhost:4000/docs`
- Filtros avançados (`eq`, `like`, `gte`, `lte`), paginação e busca global em todos os endpoints.

| Endpoint            | Método(s)            | Descrição                         | Status |
|---------------------|----------------------|-----------------------------------|--------|
| `/auth/*`           | `POST`               | Login, refresh e logout           | ✅     |
| `/pessoas`          | CRUD                 | Gestão de pessoas                 | ✅     |
| `/users`            | CRUD                 | Usuários e papéis                 | ✅     |
| `/alunos`           | CRUD                 | Gestão de alunos                  | ✅     |
| `/professores`      | CRUD                 | Gestão de professores             | ✅     |
| `/cursos`           | CRUD                 | Cursos oferecidos                 | ✅     |
| `/disciplinas`      | CRUD                 | Disciplinas por período           | ✅     |
| `/turnos`           | CRUD                 | Turnos acadêmicos                 | ✅     |
| `/curriculos`       | CRUD                 | Versionamento de currículos       | ✅     |
| `/coortes`          | CRUD                 | Turmas de ingresso                | ✅     |
| `/periodos`         | CRUD                 | Períodos curriculares             | ✅     |
| `/turmas`           | CRUD                 | Ofertas de disciplinas            | ✅     |
| `/calendario`       | CRUD                 | Eventos acadêmicos                | ✅     |
| `/health*`          | `GET`                | Health checks (geral e database)  | ✅     |
| `/metrics`          | `GET`                | Métricas Prometheus               | ✅     |

<a id="frontend-portal"></a>
## 🖥️ Frontend Portal

### Páginas Principais
- `/dashboard` com UI baseada em roles.
- `/pessoas`, `/users`, `/alunos`, `/professores`, `/cursos`, `/disciplinas`, `/turnos`, `/curriculos`, `/coortes`, `/periodos`, `/turmas`, `/calendario`, `/relatorios`, `/config`, `/meu-portal`.

### Recursos
- React 18 + TypeScript, componentes shadcn/ui e Radix UI.
- TanStack Query para cache e revalidação automática.
- React Hook Form + Zod para formulários e validações.
- Layout responsivo e pronto para PWA (planejado em roadmap).

<a id="desenvolvimento"></a>
## 🛠️ Desenvolvimento

### Padrões de Código
```typescript
// Sempre defina interfaces completas
interface NovaEntidade {
  id: number;
  nome: string;
  cursoId?: number;
  turnoId?: number;
}

// Validação com Zod
const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cursoId: z.number().min(1, 'Curso é obrigatório'),
});

// Convenções
// - Arquivos: kebab-case.ts
// - Componentes: PascalCase.tsx
// - Hooks: camelCase.ts
// - Types: PascalCase.ts
```

### Fluxo CRUD
**Backend**
1. Criar schema em `apps/api/src/db/schema/`.
2. Definir DTO e schema em `packages/shared-dtos`.
3. Implementar serviços e rotas usando a `CrudFactory`.
4. Adicionar validações e middlewares conforme necessário.

**Frontend**
1. Criar página em `apps/portal/src/pages/<entidade>/`.
2. Consumir API via `services/api`.
3. Usar `useQuery` para listagens e `useMutation` para operações, invalidando caches relacionados.

### Relacionamentos
- Utilize `db.select().from(...).leftJoin(...)` no backend para retornar objetos completos.
- No frontend, modele tipos agregados (ex.: `AlunoComRelacionamentos`) incluindo campos derivados.

### Autenticação e Autorização
- Middlewares `authMiddleware` e `hasRole` protegem rotas sensíveis.
- Frontend expõe `useAuth()` para verificar roles e renderizar UI condicional.

### Testes
- Vitest para unitários (`pnpm --filter @seminario/api test:unit`).
- Testes de integração (Supertest) e E2E (Playwright) prontos para execução.
- Artillery para performance e scripts de segurança dedicados.

### Workflow de Branches
- `main`: produção estável.
- `develop`: integração contínua.
- `feature/*`, `fix/*`, `docs/*`: branches temáticos com commits convencionais.

<a id="operacoes"></a>
## ⚙️ Operações

### Setup Local
- Requisitos: Node ≥ 18, pnpm ≥ 8, Docker, PostgreSQL 15.
- Instalação: `pnpm install` na raiz.

### Variáveis de Ambiente Essenciais
```env
DATABASE_URL="postgresql://postgres:passwd@localhost:5432/seminario_db"
JWT_SECRET="alterar-em-producao"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="alterar-refresh"
PORT=4000
NODE_ENV="development"
APP_URL="http://localhost:3001"
API_URL="http://localhost:4000"
```

### Scripts Importantes
- `pnpm dev` – API + Portal em paralelo.
- `pnpm --filter @seminario/api dev` – Apenas API.
- `pnpm --filter @seminario/portal dev` – Apenas portal.
- `pnpm build`, `pnpm lint`, `pnpm format`, `pnpm typecheck`.
- Database: `db:push`, `db:migrate`, `db:seed`, `db:studio`.

### Docker e Deploy
- Docker Compose inclui `api`, `portal`, `db` e `nginx`.
- Coolify:
  1. Conectar repositório.
  2. Configurar variáveis de ambiente.
  3. Deploy automático via push.
- Health checks e graceful shutdown configurados (timeout 30s).

### Monitoramento
- `GET /health`, `/health/database` e `/health/detailed`.
- `GET /metrics` expõe dados para Prometheus/Grafana.
- Logs estruturados com Winston (`shared-config`).

<a id="seguranca-e-performance"></a>
## 🔐 Segurança e Performance

- JWT + refresh tokens com blacklist persistente.
- Hash de senhas com bcrypt (12 rounds).
- Rate limiting (100 req/15 min por IP) e security headers ativados.
- Input validation com Zod e Drizzle previne SQL injection.
- React Query e code splitting garantem performance do portal.
- Planejamento de PWA e cache offline no roadmap.

<a id="roadmap-futuro"></a>
## 🚀 Roadmap Futuro

- **Sprint 8 – Sistema de Notas e Avaliações**
  - Lançamento de notas, cálculo de médias, controle de frequência e relatórios básicos.
- **Sprint 9 – Analytics e Relatórios**
  - Dashboards, exportações (PDF/Excel/CSV) e alertas inteligentes.
- **Sprint 10 – Mobile & PWA**
  - Push notifications, suporte offline e otimizações mobile-first.
- **Sprint 11 – Integrações Externas**
  - Email/SMS, Google Workspace, pagamentos e backup em nuvem.
- **Sprint 12 – Business Intelligence**
  - Métricas preditivas, recomendações e alertas automáticos.

<a id="suporte-e-debug"></a>
## 🆘 Suporte e Debug

- Documentação complementar em `docs/`.
- Swagger UI (`/docs`) para testar endpoints.
- Drizzle Studio via `pnpm --filter @seminario/api db:studio`.
- Logs detalhados com `pnpm --filter @seminario/api dev`.
- Problemas comuns:
  - Verificar `DATABASE_URL` e migrações.
  - Renovar tokens expirados com refresh.
  - Limpar cache de build com `pnpm clean`.
  - Regerar tipos com `pnpm typecheck`.

<a id="referencias"></a>
## 📚 Referências

- `docs/project-specs.md` – Especificações e roadmap completo.
- `docs/api-spec.md` – Documentação da API (OpenAPI).
- `docs/database-setup.md` – Configuração do banco de dados.
- `COOLIFY-DEPLOY.md` – Guia de deploy em produção.
- `docs/producao.md` – Recomendações de produção.

<a id="status-atual"></a>
## ✅ Status Atual

Sistema de Gestão Acadêmica totalmente funcional, com:
- 17 tabelas relacionais e relacionamentos consolidados.
- 8 endpoints CRUD e autenticação robusta.
- 15+ páginas no portal com UI responsiva e segura.
- 76 testes unitários passando e scripts de integração prontos.
- Pipeline de deploy preparado para Coolify.

Pronto para uso em produção, expansão com novas funcionalidades acadêmicas e monitoramento contínuo.
