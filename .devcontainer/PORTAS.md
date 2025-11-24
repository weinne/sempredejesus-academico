# 🔌 Configuração de Portas Alternativas

## Porta PostgreSQL Ocupada?

Se a porta padrão **5432** estiver ocupada no seu sistema, você pode usar portas alternativas **5433** ou **5434**.

## 📋 Métodos para Configurar Porta Alternativa

### Método 1: Variável de Ambiente (Recomendado)

Antes de abrir o container no VS Code/Cursor, defina a variável de ambiente:

```bash
export POSTGRES_PORT=5433
```

Ou para usar a porta 5434:
```bash
export POSTGRES_PORT=5434
```

Depois, abra o container normalmente.

### Método 2: Arquivo .env

Crie um arquivo `.devcontainer/.env` (na pasta `.devcontainer/`) com:

```bash
POSTGRES_PORT=5433
```

**Nota:** Este arquivo não deve ser commitado no git (já está no .gitignore).

### Método 3: Script Helper

Execute o script para verificar qual porta está disponível:

```bash
.devcontainer/check-port.sh
```

O script verificará as portas 5432, 5433 e 5434 e sugerirá qual usar.

## 🔍 Verificar Porta em Uso

Para verificar qual porta está sendo usada pelo container:

```bash
docker port seminario_db_dev
```

## ⚠️ Importante

- **Dentro do container:** A conexão sempre usa `db:5432` (porta interna do container)
- **Do host (seu computador):** Use a porta externa configurada (5432, 5433 ou 5434)

A variável `DATABASE_URL` dentro do container não precisa ser alterada, pois ela aponta para `db:5432` (nome do serviço e porta interna).

## 🔧 Exemplo de Uso

```bash
# 1. Verificar porta disponível
.devcontainer/check-port.sh

# 2. Definir porta (se necessário)
export POSTGRES_PORT=5433

# 3. Abrir container
# F1 → Dev Containers: Reopen in Container

# 4. Verificar porta em uso
docker port seminario_db_dev
# Saída esperada: 5433/tcp -> 0.0.0.0:5433
```

## 📝 Conectar do Host

Se você quiser conectar ao PostgreSQL do seu computador (fora do container):

- **Host:** `localhost`
- **Porta:** `5432` (padrão) ou `5433`/`5434` (se configurado)
- **Database:** `seminario_db`
- **Usuário:** `postgres`
- **Senha:** `passwd`

Exemplo com psql:
```bash
psql -h localhost -p 5433 -U postgres -d seminario_db
```

## 🐛 Troubleshooting

### Erro: "port is already allocated"

Isso significa que a porta está ocupada. Use uma porta alternativa:

```bash
export POSTGRES_PORT=5433
# Rebuild o container: F1 → Dev Containers: Rebuild Container
```

### Verificar qual processo está usando a porta

**Linux/macOS:**
```bash
lsof -i :5432
# ou
netstat -an | grep 5432
```

**Windows:**
```bash
netstat -ano | findstr :5432
```

