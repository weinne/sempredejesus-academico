# 🐳 Dev Container - VS Code/Cursor

Este diretório contém a configuração para desenvolver dentro de um container Docker usando VS Code ou Cursor.

## 📋 Pré-requisitos

1. **VS Code** ou **Cursor** instalado
2. Extensão **Dev Containers** instalada:
   - VS Code: [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - Cursor: Já vem pré-instalado
3. **Docker Desktop** instalado e rodando

## 🚀 Como Usar

### Opção 1: Abrir em Container (Recomendado)

1. Abra o projeto no VS Code/Cursor
2. Pressione `F1` (ou `Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Digite: `Dev Containers: Reopen in Container`
4. Selecione a opção
5. Aguarde o container ser construído e iniciado (primeira vez pode demorar)

### Opção 2: Comando de Paleta

1. `F1` → `Dev Containers: Reopen Folder in Container`

### Opção 3: Botão na Barra Inferior

1. Clique no botão verde `><` na barra inferior esquerda
2. Selecione `Reopen in Container`

## ✅ O que acontece automaticamente

- ✅ Container Docker é construído com Node.js 20 e pnpm
- ✅ PostgreSQL é iniciado automaticamente
- ✅ Dependências são instaladas (`pnpm install`)
- ✅ Schema do banco é aplicado (`pnpm db:push`)
- ✅ Portas são forwardadas automaticamente (3001, 4000, 5432)
- ✅ Extensões úteis são instaladas automaticamente

## 🛠️ Comandos Disponíveis

Dentro do container, você pode usar todos os comandos normalmente:

```bash
# Desenvolvimento
pnpm dev              # API + Portal
pnpm --filter @seminario/api dev    # Apenas API
pnpm --filter @seminario/portal dev # Apenas Portal

# Banco de dados
pnpm db:push          # Aplicar schema
pnpm db:studio        # Abrir Drizzle Studio
pnpm db:seed          # Popular com dados

# Testes
pnpm test             # Executar testes
pnpm lint             # Verificar código
pnpm typecheck        # Verificar tipos
```

## 🔌 Conexão com Banco de Dados

O PostgreSQL está disponível em:
- **Host**: `db` (dentro do container) ou `localhost` (do host)
- **Porta**: `5432`
- **Database**: `seminario_db`
- **Usuário**: `postgres`
- **Senha**: `passwd`

A variável `DATABASE_URL` já está configurada automaticamente.

## 🌐 Portas Forwardadas

- **3001**: Portal (Frontend)
- **4000**: API
- **5432**: PostgreSQL
- **8080**: Adminer (se iniciado com `--profile tools`)

## 📝 Notas

- O código é montado como volume, então mudanças são refletidas imediatamente
- `node_modules` são volumes nomeados para melhor performance
- O PostgreSQL persiste dados mesmo após fechar o container
- Para resetar tudo: `Dev Containers: Rebuild Container`

## 🔧 Troubleshooting

### Container não inicia

1. Verifique se o Docker está rodando
2. Tente rebuild: `F1` → `Dev Containers: Rebuild Container`

### Portas não funcionam

1. Verifique se as portas não estão em uso
2. Configure port forwarding manualmente se necessário

### Banco de dados não conecta

1. Verifique se o serviço `db` está saudável
2. Execute: `docker compose -f .devcontainer/docker-compose.yml ps`

### Dependências não instalam

1. Execute manualmente: `pnpm install`
2. Verifique logs: `Dev Containers: Show Container Log`

