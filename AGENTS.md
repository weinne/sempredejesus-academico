# Guia para Contribuidores (AGENTS)

Este documento resume o stack, a organização do monorepo e os comandos de desenvolvimento/teste utilizados neste repositório. Quando em dúvida, siga os padrões existentes e abra um PR pequeno para feedback.

## Visão Geral do Monorepo
- Gerenciador: `pnpm` (workspaces) + `turbo` para orquestrar scripts.
- Node: `>= 18`. Recomendado usar a versão do `.nvmrc`/engines.
- Apps:
  - `apps/api`: Backend Express 5 + TypeScript, PostgreSQL (Drizzle ORM), Swagger, Vitest, Playwright, Artillery.
  - `apps/portal`: Frontend React 18 + Vite + TypeScript + TailwindCSS + Radix UI + Zustand + React Query.
- Pacotes compartilhados (`packages/*`):
  - `shared-auth` (JWT, Passport, bcrypt),
  - `shared-config` (dotenv-flow, logger com Winston),
  - `shared-dtos` (schemas Zod),
  - `shared-tests` (utilitários de testes com Vitest/Supertest/RTL).

Estrutura resumida:
```
apps/
  api/
  portal/
packages/
  shared-auth/
  shared-config/
  shared-dtos/
  shared-tests/
docs/
```

## Requisitos e Instalação
- Pré‑requisitos: Node >=18, pnpm >=8, Docker/Docker Compose, PostgreSQL 15.
- Instalação:
```
pnpm install
```
- Variáveis de ambiente: copie `.env.example` → `.env` na raiz e ajuste. A API também possui `.env` próprio em `apps/api` se necessário.

## Comandos na Raiz (via Turborepo)
- `pnpm dev`: roda `dev` em todos os apps (API + Portal).
- `pnpm build`: build de todos os workspaces.
- `pnpm lint`: ESLint em todos os pacotes.
- `pnpm test`: executa a suíte de testes orquestrada.
- `pnpm test:ci`: testes com cobertura nas unidades que suportam.
- `pnpm format`: Prettier (`**/*.{ts,tsx,md}`).
- `pnpm typecheck`: `tsc --noEmit` em todos os pacotes.

Dicas:
- Use `pnpm --filter <workspace>` para focar em um projeto específico. Ex.: `pnpm --filter @seminario/api dev`.

## Backend (apps/api)
- Stack: Express 5, TypeScript, Drizzle ORM (`postgres` driver), Zod (+ zod-to-openapi), Passport JWT, Helmet, Rate Limit, Multer, Swagger UI.
- Principais scripts:
  - `dev`: `nodemon` + `ts-node` em `src/server.ts`.
  - `build`: `tsc` → `dist/`.
  - `start`: executa `node dist/server.js`.
  - Banco: `db:push`, `db:migrate`, `db:seed`, `db:studio` (via `drizzle-kit`).
  - Testes:
    - Unit: `pnpm --filter @seminario/api test:unit` (Vitest)
    - Integração: `pnpm --filter @seminario/api test:integration`
    - E2E: `pnpm --filter @seminario/api test:e2e` (Playwright)
    - Performance: `pnpm --filter @seminario/api test:performance` (Artillery)
    - Segurança: `pnpm --filter @seminario/api test:security`
- Endpoints úteis em dev:
  - API: `http://localhost:4000`
  - Swagger: `http://localhost:4000/docs`
  - Health: `http://localhost:4000/health`

Banco de dados (dev):
- Subir Postgres: `docker-compose -f docker-compose.dev.yml up db -d`
- Aplicar schema: `pnpm db:push`
- Seed (usuários): `pnpm --filter @seminario/api seed:users`

## Frontend (apps/portal)
- Stack: React 18, Vite, TypeScript, TailwindCSS, Radix UI, Zustand, React Query, Axios, React Router.
- Scripts:
  - `dev`: `vite` (porta padrão do projeto: `3001`).
  - `build`: `tsc && vite build`.
  - `preview`: `vite preview`.
  - `lint`, `lint:fix`, `type-check`.
- Observação: testes de frontend ainda não estão configurados (mensagem no `package.json`).

## Estilo de Código
- TypeScript com ESLint e Prettier (2 espaços). Respeite o padrão do workspace.
- Nomes: `kebab-case` para arquivos TS/TSX, `PascalCase` para componentes React.
- Mantenha módulos pequenos, com APIs explícitas.

## Testes
- Frameworks:
  - Backend: Vitest (unit/integration), Playwright (E2E), Artillery (performance), auditoria básica (`npm audit`).
  - Shared-tests: utilitários comuns (Vitest/Supertest/RTL) para reaproveitamento.
- Estrutura de testes da API: `apps/api/src/tests/{unit,integration,performance,e2e}`.
- Metas: busque ≥80% de cobertura nas mudanças; use `pnpm --filter @seminario/api test:ci` para gerar relatórios.

## Commits & Pull Requests
- Commits no formato convencional (commitlint configurado): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- Husky habilita hooks; rode linters e testes antes de abrir PR.
- PRs: descrição clara, issues vinculadas (`Closes #123`), screenshots para mudanças de UI e notas de risco/testes.

## Segurança & Configuração
- Nunca comite segredos. Use `.env` locais e documente variáveis no `README`.
- Variáveis sensíveis típicas (exemplos):
  - `DATABASE_URL`
  - `JWT_SECRET`, `JWT_EXPIRES_IN`
  - `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`
- Valide e sanitize entradas externas; cubra rotas sensíveis com testes.

## Docker & Deploy
- Imagens e processos: `Dockerfile`, `docker-compose.yml` e `docker-compose.dev.yml` disponíveis.
- Deploy: ver `COOLIFY-DEPLOY.md` e `docs/producao.md` para fluxo recomendado (Coolify).

## Ajuda
- Abra um PR rascunho cedo com dúvidas específicas e referências de arquivos.
- Consulte documentação adicional em `README.md` e `docs/` (API specs, progresso, políticas de RLS, etc.).
