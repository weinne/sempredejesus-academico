# 🚀 Quick Start - Dev Container

## Passo a Passo Rápido

### 1️⃣ Abrir o Projeto
```bash
cd sempredejesus-academico
code .  # ou cursor .
```

### 2️⃣ Limpar Containers Antigos (se necessário)

Se você receber erro de "container name already in use":
```bash
.devcontainer/cleanup.sh
```

### 3️⃣ Abrir em Container
- **Opção A**: Clique no botão verde `><` no canto inferior esquerdo → `Reopen in Container`
- **Opção B**: `F1` → Digite `Dev Containers: Reopen in Container` → Enter

### 4️⃣ Aguardar
- Primeira vez: ~5-10 minutos (construção do container)
- Próximas vezes: ~30 segundos (container já existe)

### 5️⃣ Desenvolver
```bash
# No terminal integrado (já está no container!)
pnpm dev
```

### 6️⃣ Acessar
- Portal: http://localhost:3001
- API: http://localhost:4000
- Docs: http://localhost:4000/docs

## ✅ Pronto!

Tudo configurado automaticamente:
- ✅ Node.js 20 instalado
- ✅ pnpm 10.22.0 instalado
- ✅ Dependências instaladas
- ✅ PostgreSQL 15 rodando
- ✅ Schema aplicado
- ✅ Variáveis de ambiente configuradas
- ✅ Docker-in-Docker habilitado

## 🔧 Comandos Úteis

```bash
pnpm dev              # Iniciar desenvolvimento
pnpm db:studio        # Abrir Drizzle Studio
pnpm test             # Executar testes
pnpm lint             # Verificar código
```

## ⚠️ Problema Comum: Porta 5432 Ocupada

Se você receber o erro `address already in use` na porta 5432:

**Solução rápida (antes de abrir o container):**
```bash
export POSTGRES_PORT=5433
# Depois abra o container normalmente
```

**Solução permanente:**
Crie `.devcontainer/.env`:
```
POSTGRES_PORT=5433
```

**Verificar porta disponível:**
```bash
.devcontainer/check-port.sh
```

Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para mais soluções.

## 📚 Documentação Completa

Veja [docs/devcontainer-guide.md](../../docs/devcontainer-guide.md) para guia detalhado.

