# ⚠️ Problema Conhecido: DevContainer CLI com Override Files

## 🔍 Diagnóstico

O erro ocorre quando o devcontainer CLI tenta combinar múltiplos arquivos docker-compose:
- `.devcontainer/docker-compose.yml` (nosso arquivo)
- Arquivos temporários de override gerados pelo CLI

**O comando manual funciona perfeitamente**, mas o CLI falha ao combinar os arquivos.

## ✅ Soluções

### Solução 1: Limpar e Tentar Novamente (Recomendado)

```bash
# 1. Limpar tudo
.devcontainer/cleanup.sh

# 2. Fechar completamente o VS Code/Cursor

# 3. Reabrir o projeto

# 4. Tentar novamente: F1 → Dev Containers: Reopen in Container
```

### Solução 2: Iniciar Manualmente e Depois Conectar (Mais Fácil)

```bash
# Use o script helper:
.devcontainer/start-manual.sh

# Depois no VS Code/Cursor: F1 → Dev Containers: Attach to Running Container
# Selecione: seminario_dev
```

Ou manualmente:
```bash
# 1. Limpar
.devcontainer/cleanup.sh

# 2. Iniciar containers manualmente
cd /home/weinne/Dev/sempredejesus-academico
docker compose -f .devcontainer/docker-compose.yml up -d

# 3. Aguardar containers iniciarem
docker ps | grep seminario

# 4. No VS Code/Cursor: F1 → Dev Containers: Attach to Running Container
#    Selecione: seminario_dev
```

### Solução 3: Usar Dockerfile ao Invés de Docker Compose

Se o problema persistir, podemos converter para usar apenas Dockerfile (sem docker-compose). Isso elimina o problema de override files, mas você precisará iniciar o PostgreSQL manualmente.

### Solução 4: Workaround com Script

Crie um alias ou script que sempre limpa antes:

```bash
# Adicione ao ~/.bashrc ou ~/.zshrc
alias devcontainer-start='cd /home/weinne/Dev/sempredejesus-academico && .devcontainer/cleanup.sh && code .'
```

## 🔧 Verificação

Para verificar se os containers estão rodando:

```bash
docker ps | grep seminario
docker compose -f .devcontainer/docker-compose.yml ps
```

Se os containers estiverem rodando, você pode simplesmente conectar:
- VS Code/Cursor: `F1` → `Dev Containers: Attach to Running Container`

## 📝 Notas Técnicas

O problema parece estar relacionado a:
1. Conflitos entre `container_name` fixos e overrides do CLI
2. Problemas de validação ao combinar múltiplos arquivos compose
3. Possível bug na versão do devcontainer CLI

**Status:** O docker-compose.yml está correto e funciona manualmente. O problema é específico do devcontainer CLI.

## 🐛 Workaround Temporário

Enquanto isso não é resolvido, use a **Solução 2** acima para trabalhar normalmente.

