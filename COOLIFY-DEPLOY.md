# 🚀 Guia de Deploy no Coolify

Este guia descreve o fluxo recomendado para publicar o Sistema Acadêmico no Coolify usando **Nixpacks**. A configuração foi ajustada
para reduzir o consumo de memória durante o build – um problema comum em instâncias menores, especialmente quando o Turborepo
executa builds em paralelo e instala pacotes de testes desnecessários.

## 🧱 Visão Geral da Pipeline

1. **Instalação enxuta** com `pnpm` apenas para os workspaces necessários (`api`, `portal` e pacotes compartilhados usados em produção).
2. **Build sequencial** (`--concurrency=1`) para evitar que TypeScript/Vite sejam executados ao mesmo tempo e estourem o limite de RAM.
3. **Start script** único (`scripts/nixpacks-start.sh`) que delega para `scripts/start-production.sh`, garantindo migrações automáticas
   e verificação do banco antes de subir a API.

Todas essas etapas são orquestradas pelo arquivo [`nixpacks.toml`](./nixpacks.toml).

## ⚙️ Configurações no Coolify

### 1. Banco de Dados
Crie um serviço PostgreSQL 15 e anote usuário, senha e host para montar a `DATABASE_URL`.

### 2. Aplicação
- **Source**: GitHub/GitLab
- **Build Pack**: Nixpacks (detecção automática)
- **Porta**: `4000`
- **Health Check**: `/health`

### 3. Variáveis de Ambiente
No menu *Application → Environment Variables* configure ao menos:

```bash
DATABASE_URL=postgresql://postgres:SUA_SENHA@postgres-service:5432/seminario_db
JWT_SECRET=chave-jwt-super-segura
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=chave-refresh-super-segura
NODE_ENV=production
PORT=4000
APP_URL=https://seudominio.com
API_URL=https://api.seudominio.com
```

Opcionalmente acrescente as chaves de rate limit se desejar valores diferentes do padrão.

## 📦 O que o `nixpacks.toml` faz

| Fase              | Ação                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup`           | Habilita `corepack` e garante Node 18 + pnpm.                                                                                                 |
| `install`         | Executa `pnpm install --filter` somente para `api`, `portal`, `shared-auth`, `shared-config` e `shared-dtos`, evitando baixar pacotes de test. |
| `build`           | Roda `turbo run build` com `--concurrency=1` e sem daemon, reduzindo o pico de memória no Coolify.                                             |
| `start`           | Usa `scripts/nixpacks-start.sh`, que apenas delega para `scripts/start-production.sh` (migrações + boot da API).                               |

> 💡 Dica: se o deploy ainda consumir muita memória, aumente o swap da instância ou reduza a flag `--concurrency` para outra etapa
> customizada (ex.: build separado do portal).

## ✅ Pós-deploy

Após o deploy, verifique:
- `GET /health` – status geral
- `GET /health/database` – conectividade com o Postgres
- `GET /docs` – documentação Swagger

Logs completos ficam disponíveis na interface do Coolify.

## 🐛 Troubleshooting

| Sintoma                            | Diagnóstico sugerido                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Build trava ou mata o contêiner    | Verifique se o build está usando o `nixpacks.toml` atualizado. Confirme a RAM disponível na instância.|
| Erro de conexão com Postgres       | Cheque `DATABASE_URL` e se o serviço do banco está acessível a partir da aplicação.                  |
| Migrações não são aplicadas        | Inspecione os logs da aplicação: `scripts/start-production.sh` exibe qualquer falha de migração.     |

Pronto! Com essa configuração o deploy fica mais previsível e com consumo de memória muito menor, permitindo builds estáveis no
Coolify mesmo em máquinas com recursos modestos.
