# 📦 Como Instalar pnpm no Ubuntu/Xubuntu

## ❌ Problema
Erro de permissão ao tentar instalar pnpm:
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

## ✅ Soluções

### **Opção 1: Usar sudo (Recomendado - Instalação única)**

```bash
# Instalar pnpm globalmente com sudo
sudo npm install -g pnpm

# Verificar instalação
pnpm --version
```

**Vantagem:** Instalação permanente, disponível em qualquer terminal.

---

### **Opção 2: Usar corepack com sudo (Método oficial Node.js)**

```bash
# Habilitar corepack (precisa sudo uma vez)
sudo corepack enable

# Preparar pnpm
corepack prepare pnpm@latest --activate

# Verificar
pnpm --version
```

**Vantagem:** Método oficial do Node.js, gerencia versões automaticamente.

---

### **Opção 3: Instalar via script standalone (sem npm)**

```bash
# Instalar curl primeiro (se não tiver)
sudo apt install -y curl

# Instalar pnpm via script oficial
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Recarregar o shell
source ~/.bashrc

# Verificar
pnpm --version
```

**Vantagem:** Instala no diretório do usuário, não precisa sudo.

---

### **Opção 4: Usar npx (Temporário - não recomendado para desenvolvimento)**

```bash
# Usar pnpm via npx (mais lento, mas funciona)
npx pnpm install
npx pnpm dev
```

**Desvantagem:** Precisa usar `npx pnpm` antes de cada comando.

---

### **Opção 5: Configurar npm para diretório local**

```bash
# Criar diretório para pacotes globais do usuário
mkdir -p ~/.npm-global

# Configurar npm para usar este diretório
npm config set prefix '~/.npm-global'

# Adicionar ao PATH (adicionar ao ~/.bashrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Tentar instalar novamente
npm install -g pnpm

# Verificar
pnpm --version
```

**Nota:** Se ainda der erro, pode ser que o npm esteja configurado em outro lugar. Verifique:
```bash
npm config get prefix
npm config list
```

---

## 🎯 Recomendação

**Use a Opção 1 ou 2** - são as mais simples e funcionam bem:

```bash
# Opção mais simples:
sudo npm install -g pnpm

# Ou método oficial:
sudo corepack enable
corepack prepare pnpm@latest --activate
```

Ambas precisam de sudo apenas uma vez, e depois o pnpm estará disponível permanentemente.

---

## ✅ Verificar Instalação

Após instalar, verifique:

```bash
pnpm --version
# Deve mostrar algo como: 10.22.0 ou superior
```

---

## 🚀 Continuar Setup

Depois de instalar o pnpm, continue com o setup:

```bash
cd /home/weinne/Dev/sempredejesus-academico

# Instalar dependências
pnpm install

# Continuar com o resto do setup
./scripts/native-dev-setup.sh
```

---

## 🐛 Troubleshooting

### pnpm não encontrado após instalação

```bash
# Verificar se está no PATH
which pnpm

# Se não estiver, recarregar o shell
source ~/.bashrc

# Ou fechar e abrir um novo terminal
```

### Ainda dá erro de permissão

```bash
# Verificar permissões do diretório npm
ls -la /usr/local/lib/node_modules

# Se necessário, corrigir permissões (CUIDADO!)
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

---

**✨ Escolha uma opção acima e continue com o setup!**

