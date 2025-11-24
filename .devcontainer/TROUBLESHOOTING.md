# 🔧 Troubleshooting - Dev Container

## Erro: "address already in use" na porta 5432

### Sintoma
```
Error response from daemon: failed to bind host port 0.0.0.0:5432/tcp: address already in use
```

### Causa
A porta 5432 está sendo usada por outro processo (provavelmente um PostgreSQL local).

### Solução Rápida

**1. Verificar qual processo está usando a porta:**
```bash
# Linux
ss -tuln | grep 5432
# ou
lsof -i :5432

# Windows
netstat -ano | findstr :5432
```

**2. Definir porta alternativa ANTES de abrir o container:**

```bash
# No terminal, antes de abrir o container:
export POSTGRES_PORT=5433
```

**3. Abrir o container normalmente:**
- VS Code/Cursor: `F1` → `Dev Containers: Reopen in Container`

**4. Verificar qual porta está sendo usada:**
```bash
docker port seminario_db_dev
```

### Solução Permanente

Crie um arquivo `.devcontainer/.env` (não commitado):
```bash
POSTGRES_PORT=5433
```

Ou adicione ao seu `~/.bashrc` ou `~/.zshrc`:
```bash
export POSTGRES_PORT=5433
```

## Erro: "container name is already in use" ou "Command failed: docker compose ... up -d"

### Sintoma
```
Error response from daemon: Conflict. The container name "/seminario_db_dev" is already in use
```

ou

```
Command failed: docker compose ... up -d
An error occurred starting Docker Compose up.
```

### ⚠️ Problema Conhecido com DevContainer CLI

Se o comando manual funciona mas o devcontainer CLI falha, veja [DEVCONTAINER-CLI-ISSUE.md](./DEVCONTAINER-CLI-ISSUE.md) para soluções detalhadas.

### Solução Rápida

**1. Execute o script de limpeza:**
```bash
.devcontainer/cleanup.sh
```

**2. Se ainda não funcionar, limpe manualmente:**
```bash
# Parar e remover containers
docker compose -f .devcontainer/docker-compose.yml down

# Remover containers manualmente
docker rm -f seminario_db_dev seminario_dev seminario_adminer

# Remover imagens antigas (opcional)
docker rmi sempredejesus-academico_devcontainer-dev 2>/dev/null || true
```

**3. Solução Alternativa - Iniciar Manualmente:**
```bash
# Iniciar containers manualmente
docker compose -f .devcontainer/docker-compose.yml up -d

# Depois conectar: F1 → Dev Containers: Attach to Running Container
# Selecione: seminario_dev
```

**4. Ou tente novamente:**
- `F1` → `Dev Containers: Reopen in Container`
- Ou `F1` → `Dev Containers: Rebuild Container` para rebuild completo

### Solução Permanente

Sempre execute o cleanup antes de fazer rebuild:
```bash
.devcontainer/cleanup.sh
# Depois: F1 → Dev Containers: Rebuild Container
```

### Se o problema persistir

1. **Verifique logs do Docker:**
   ```bash
   docker compose -f .devcontainer/docker-compose.yml logs
   ```

2. **Verifique se há processos usando as portas:**
   ```bash
   ss -tuln | grep -E "(3001|4000|5432|5433|5434)"
   ```

3. **Limpe tudo e comece do zero:**
   ```bash
   .devcontainer/cleanup.sh
   docker system prune -f
   # Depois: F1 → Dev Containers: Rebuild Container
   ```

4. **Use a solução alternativa (iniciar manualmente):**
   Veja [DEVCONTAINER-CLI-ISSUE.md](./DEVCONTAINER-CLI-ISSUE.md) para detalhes.

## Erro ao construir a imagem

### Sintoma
Erro durante o build do Dockerfile.

### Solução

1. Limpar cache do Docker:
```bash
docker system prune -a
```

2. Rebuild forçado:
```bash
docker compose -f .devcontainer/docker-compose.yml build --no-cache
```

## Container não inicia

### Verificar logs:
```bash
docker logs seminario_db_dev
docker logs seminario_dev
```

### Verificar status:
```bash
docker ps -a | grep seminario
docker compose -f .devcontainer/docker-compose.yml ps
```

## Banco de dados não conecta

### Verificar se está rodando:
```bash
docker exec seminario_db_dev pg_isready -U postgres
```

### Testar conexão:
```bash
docker exec -it seminario_db_dev psql -U postgres -d seminario_db
```

### Verificar variável DATABASE_URL:
```bash
docker exec seminario_dev env | grep DATABASE_URL
```

## Dependências não instalam

### Executar manualmente:
```bash
docker exec -it seminario_dev pnpm install
```

### Verificar pnpm:
```bash
docker exec seminario_dev pnpm --version
```

## Resetar tudo

Para começar do zero:

```bash
# Parar e remover containers
docker compose -f .devcontainer/docker-compose.yml down -v

# Remover volumes
docker volume rm devcontainer_postgres_dev_data devcontainer_node_modules devcontainer_api_node_modules devcontainer_portal_node_modules

# Rebuild
docker compose -f .devcontainer/docker-compose.yml build --no-cache
docker compose -f .devcontainer/docker-compose.yml up -d
```

## Verificar porta PostgreSQL em uso

Execute o script helper:
```bash
.devcontainer/check-port.sh
```

Ou manualmente:
```bash
# Ver qual porta o container está usando
docker port seminario_db_dev

# Deve mostrar algo como:
# 5432/tcp -> 0.0.0.0:5433
```

## Conectar do host com porta alternativa

Se você configurou `POSTGRES_PORT=5433`, conecte assim:

```bash
# psql
psql -h localhost -p 5433 -U postgres -d seminario_db

# String de conexão
postgresql://postgres:passwd@localhost:5433/seminario_db
```

## Ainda com problemas?

1. Verifique os logs completos:
```bash
docker compose -f .devcontainer/docker-compose.yml logs
```

2. Rebuild completo do container:
   - VS Code/Cursor: `F1` → `Dev Containers: Rebuild Container`

3. Verifique se o Docker está rodando:
```bash
docker ps
```

4. Verifique recursos do Docker:
```bash
docker system df
```

