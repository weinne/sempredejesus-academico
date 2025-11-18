# 🐳 Guia Completo: Desenvolvimento com Dev Containers

Este guia explica como usar o ambiente de desenvolvimento containerizado no VS Code ou Cursor.

## 📋 O que é Dev Container?

Dev Container permite desenvolver dentro de um container Docker, garantindo:
- ✅ Ambiente consistente entre desenvolvedores
- ✅ Não precisa instalar Node.js, pnpm, PostgreSQL localmente
- ✅ Configuração automática de tudo
- ✅ Isolamento do ambiente de desenvolvimento

## 🎯 Pré-requisitos

### 1. Instalar Docker Desktop

**Windows/macOS:**
- Baixe em: https://www.docker.com/products/docker-desktop/
- Instale e inicie o Docker Desktop

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Instalar VS Code ou Cursor

- **VS Code**: https://code.visualstudio.com/
- **Cursor**: https://cursor.sh/

### 3. Instalar Extensão Dev Containers

**VS Code:**
1. Abra o VS Code
2. Vá em Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Procure por "Dev Containers"
4. Instale a extensão da Microsoft

**Cursor:**
- A extensão já vem pré-instalada! ✅

## 🚀 Primeiro Uso - Passo a Passo

### Passo 1: Abrir o Projeto

```bash
# Clone ou abra o projeto
cd sempredejesus-academico

# Abra no VS Code/Cursor
code .  # ou cursor .
```

### Passo 2: Abrir em Container

**Método 1: Botão na Barra Inferior**
1. Procure o botão verde `><` no canto inferior esquerdo
2. Clique nele
3. Selecione `Reopen in Container`

**Método 2: Comando de Paleta**
1. Pressione `F1` (ou `Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Digite: `Dev Containers: Reopen in Container`
3. Pressione Enter

**Método 3: Notificação**
- Se o VS Code/Cursor detectar o arquivo `.devcontainer/devcontainer.json`, uma notificação aparecerá perguntando se você quer abrir em container

### Passo 3: Aguardar Construção

Na primeira vez, o container será construído. Isso pode levar alguns minutos:

```
[1/4] Building dev container...
[2/4] Installing Node.js 20...
[3/4] Installing pnpm...
[4/4] Installing dependencies...
```

Você verá uma barra de progresso no canto inferior direito.

### Passo 4: Aguardar Configuração Automática

Após o container iniciar, os seguintes comandos são executados automaticamente:

1. ✅ `pnpm install` - Instala todas as dependências
2. ✅ `pnpm db:push` - Aplica o schema do banco de dados
3. ✅ PostgreSQL é iniciado e aguarda conexões

### Passo 5: Verificar se Funcionou

Abra um terminal dentro do VS Code/Cursor (`Ctrl+`` ou `Cmd+``) e execute:

```bash
# Verificar Node.js
node --version  # Deve mostrar v20.x.x

# Verificar pnpm
pnpm --version  # Deve mostrar versão instalada

# Verificar PostgreSQL
docker exec seminario_db_dev pg_isready -U postgres
# Deve retornar: seminario_db_dev:5432 - accepting connections
```

## 💻 Desenvolvendo no Container

### Iniciar Desenvolvimento

```bash
# Iniciar API + Portal
pnpm dev

# Ou apenas API
pnpm --filter @seminario/api dev

# Ou apenas Portal
pnpm --filter @seminario/portal dev
```

### Acessar Aplicações

Após iniciar, as portas são forwardadas automaticamente:

- 🌐 **Portal**: http://localhost:3001
- 🚀 **API**: http://localhost:4000
- 📖 **API Docs**: http://localhost:4000/docs
- 🏥 **Health Check**: http://localhost:4000/health

### Comandos Úteis

```bash
# Banco de dados
pnpm db:push          # Aplicar schema
pnpm db:studio        # Abrir Drizzle Studio (GUI)
pnpm db:seed          # Popular com dados de teste

# Desenvolvimento
pnpm lint             # Verificar código
pnpm typecheck        # Verificar tipos TypeScript
pnpm format           # Formatar código

# Testes
pnpm test             # Executar testes unitários
pnpm test:integration # Executar testes de integração
```

## 🔌 Conectando ao Banco de Dados

### Dentro do Container

A variável `DATABASE_URL` já está configurada automaticamente:

```bash
# Verificar variável
echo $DATABASE_URL
# Deve mostrar: postgresql://postgres:passwd@db:5432/seminario_db
```

### Do Host (seu computador)

Você também pode conectar do seu computador:

- **Host**: `localhost`
- **Porta**: `5432`
- **Database**: `seminario_db`
- **Usuário**: `postgres`
- **Senha**: `passwd`

### Usando Extensões do VS Code

As seguintes extensões são instaladas automaticamente:

1. **Database Client** - Para conectar e gerenciar o banco
2. **SQLTools** - Para executar queries SQL

**Como usar:**

1. Abra a extensão Database Client ou SQLTools
2. Configure nova conexão:
   - Host: `db` (dentro do container) ou `localhost` (do host)
   - Port: `5432`
   - Database: `seminario_db`
   - User: `postgres`
   - Password: `passwd`

## 🛠️ Comandos do Dev Container

### Rebuild Container

Se algo der errado ou quiser reconstruir do zero:

1. `F1` → `Dev Containers: Rebuild Container`
2. Aguarde a reconstrução

### Ver Logs

1. `F1` → `Dev Containers: Show Container Log`
2. Veja os logs do container

### Voltar para Local

Se quiser desenvolver localmente novamente:

1. `F1` → `Dev Containers: Reopen Folder Locally`
2. O projeto será reaberto sem container

### Executar Comando no Container

1. `F1` → `Dev Containers: Execute Command in Container`
2. Digite o comando desejado

## 📁 Estrutura de Arquivos

```
.devcontainer/
├── devcontainer.json      # Configuração principal
├── docker-compose.yml     # Compose do Dev Container
├── Dockerfile             # Imagem do container de desenvolvimento
└── README.md              # Documentação rápida
```

## 🔧 Configurações Personalizadas

### Adicionar Extensões

Edite `.devcontainer/devcontainer.json` e adicione na seção `extensions`:

```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "sua-extensao-aqui"
      ]
    }
  }
}
```

### Adicionar Variáveis de Ambiente

Edite `.devcontainer/devcontainer.json`:

```json
{
  "remoteEnv": {
    "SUA_VARIAVEL": "valor"
  }
}
```

### Adicionar Comandos Pós-Criação

Edite `.devcontainer/devcontainer.json`:

```json
{
  "postCreateCommand": "seu-comando-aqui"
}
```

## 🐛 Troubleshooting

### Problema: Container não inicia

**Solução:**
1. Verifique se o Docker Desktop está rodando
2. Verifique se há portas em conflito
3. Tente rebuild: `F1` → `Dev Containers: Rebuild Container`

### Problema: Portas não funcionam

**Solução:**
1. Verifique se as portas não estão em uso:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Linux/macOS
   lsof -i :3001
   ```
2. Pare o processo que está usando a porta ou mude a porta no `devcontainer.json`

### Problema: Banco de dados não conecta

**Solução:**
1. Verifique se o serviço `db` está rodando:
   ```bash
   docker ps | grep seminario_db_dev
   ```
2. Verifique os logs:
   ```bash
   docker logs seminario_db_dev
   ```
3. Teste a conexão:
   ```bash
   docker exec seminario_db_dev pg_isready -U postgres
   ```

### Problema: Dependências não instalam

**Solução:**
1. Execute manualmente:
   ```bash
   pnpm install
   ```
2. Se persistir, tente rebuild do container

### Problema: Mudanças não aparecem

**Solução:**
- O código é montado como volume, então mudanças devem aparecer imediatamente
- Se não aparecer, verifique se está editando no container (não localmente)
- Tente recarregar a janela: `F1` → `Developer: Reload Window`

### Problema: Performance lenta

**Solução:**
- `node_modules` são volumes nomeados para melhor performance
- Se ainda estiver lento, verifique recursos do Docker Desktop
- Aumente memória/CPU alocada ao Docker nas configurações

## 💡 Dicas e Truques

### 1. Usar Terminal Integrado

O terminal integrado do VS Code/Cursor já está dentro do container automaticamente!

### 2. Debugging

O debugging funciona normalmente dentro do container. Configure seus breakpoints normalmente.

### 3. Git

O Git funciona normalmente dentro do container. Suas credenciais são compartilhadas automaticamente.

### 4. Extensões

Todas as extensões instaladas no container são isoladas. Você pode ter extensões diferentes no container e localmente.

### 5. Persistência de Dados

- Código: Sincronizado em tempo real (volume montado)
- `node_modules`: Volume nomeado (persiste entre rebuilds)
- Banco de dados: Volume nomeado (dados persistem)

## 🎉 Pronto!

Agora você está desenvolvendo em um ambiente containerizado completo! 

**Vantagens:**
- ✅ Ambiente consistente
- ✅ Não precisa instalar nada localmente
- ✅ Fácil de compartilhar com outros desenvolvedores
- ✅ Isolado do seu sistema

**Próximos passos:**
1. Execute `pnpm dev` para iniciar
2. Acesse http://localhost:3001
3. Comece a desenvolver! 🚀

---

**Dúvidas?** Consulte a documentação oficial:
- [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose](https://docs.docker.com/compose/)

