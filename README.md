# Sistema de Gestão Acadêmica - Seminário Presbiteriano de Jesus

**🚀 Status Atual**: Full-Stack Funcional - Sistema Utilizável por Usuários Finais  
**📊 Progresso**: 5 de 11 sprints completos (45% do roadmap total)  
**🎯 Próximo Foco**: Expandir funcionalidades CRUD e features acadêmicas

Sistema completo de gestão acadêmica desenvolvido para substituir o sistema legado, oferecendo uma solução moderna e robusta para administração de alunos, professores, cursos, turmas e avaliações.

---

## 📚 **DOCUMENTAÇÃO COMPLETA**

Para informações detalhadas sobre o projeto, consulte:

- **[📊 Progress Tracker](./docs/progress-tracker.md)** - Status detalhado dos sprints e funcionalidades implementadas
- **[🎯 Project Specs](./docs/project-specs.md)** - Roadmap estratégico, arquitetura e especificações técnicas
- **[📝 API Specification](./docs/api-spec.md)** - Documentação técnica da API
- **[🔒 RLS Policies](./docs/rls-policies.md)** - Políticas de segurança do banco
- **[🚀 Production Ready](./docs/producao.md)** - Guia completo para deploy

---

## ✅ **SISTEMA ATUAL - FUNCIONAL PARA USUÁRIOS FINAIS**

### 🎉 **O que está funcionando AGORA:**
- ✅ **Login seguro** com 4 tipos de usuário (Admin, Secretaria, Professor, Aluno)
- ✅ **Dashboard personalizado** por perfil de usuário
- ✅ **Gestão completa de pessoas** (CRUD com formulários)
- ✅ **Visualização** de alunos, professores e cursos
- ✅ **Interface responsiva** para desktop e mobile
- ✅ **Backend production-ready** com monitoramento e segurança

### 🔐 **Credenciais para Teste:**
```bash
# Administrador
Email: admin@seminario.edu
Senha: admin123

# Secretaria
Email: secretaria@seminario.edu
Senha: test123

# Professor
Email: professor@seminario.edu
Senha: test123

# Aluno
Email: aluno@seminario.edu
Senha: test123
```

---

## 🚀 **Setup Rápido**

### **Pré-requisitos**
- Node.js ≥18.0.0
- pnpm ≥8.0.0
- Docker e Docker Compose
- PostgreSQL 15

### **1. Instalação**
```bash
git clone <repository-url>
cd sempredejesus-academico
pnpm install
```

### **2. Configuração**

#### **Opção A: Docker (Recomendado)**
```bash
# Setup completo automático (recomendado)
# Linux/macOS:
./scripts/docker-dev-setup.sh

# Windows PowerShell:
.\scripts\docker-dev-setup.ps1

# Ou usando npm script:
pnpm docker:setup

# O script configura tudo automaticamente:
# - Cria arquivo .env se não existir
# - Inicia PostgreSQL no Docker
# - Instala dependências
# - Aplica schema do banco
# - Os usuários de teste serão criados automaticamente ao iniciar o servidor!
```

**Setup Manual (alternativa):**
```bash
# Copiar variáveis de ambiente
cp .env.example .env

# Subir banco de dados PostgreSQL
pnpm docker:dev

# Configurar banco automaticamente (aplica schema)
pnpm dev-setup
# Ou no Windows PowerShell: .\scripts\dev-setup.ps1
```

#### **Opção B: PostgreSQL Local**
```bash
# Instalar PostgreSQL 15+ localmente
# Criar database: createdb seminario_db

# Copiar variáveis de ambiente
cp .env.example .env
# Ajustar DATABASE_URL no .env

# Aplicar schema
pnpm db:push
```

📖 **Documentação completa**: 
- [Docker Setup](./docs/docker-dev-setup.md) - Configuração Docker tradicional
- [Dev Container Guide](./docs/devcontainer-guide.md) - Desenvolvimento com Dev Containers (VS Code/Cursor)

### **3. Executar**
```bash
# Desenvolvimento (API + Portal)
pnpm dev

# Apenas API
pnpm dev:api

# Apenas Frontend
pnpm dev:portal
```

### **4. Acessar**
- **🌐 Portal (Frontend):** http://localhost:3001
- **🚀 API:** http://localhost:4000
- **📖 Documentação API:** http://localhost:4000/docs
- **🏥 Health Check:** http://localhost:4000/health

---

## 🏗️ **Arquitetura**

### **Monorepo Structure**
```
sempredejesus-academico/
├── apps/
│   ├── api/           # ✅ Backend Express + TypeScript (Production-Ready)
│   └── portal/        # ✅ Frontend React 18 + Vite (Funcional)
├── packages/          # ✅ Shared libraries (auth, config, dtos, tests)
└── docs/              # ✅ Documentação completa
```

### **Tech Stack**
- **Backend:** Express 5 + TypeScript + PostgreSQL + Drizzle ORM
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Autenticação:** JWT + Refresh Tokens + Blacklisting
- **Deploy:** Docker + Coolify ready

---

## 📊 **Scripts Úteis**

```bash
# Desenvolvimento
pnpm dev              # API + Portal
pnpm build            # Build completo
pnpm test             # Testes
pnpm lint             # ESLint

# Banco de Dados
pnpm db:push          # Aplicar schema
pnpm db:studio        # GUI do banco

# Usuários
pnpm --filter @seminario/api seed:users                       # Criar todos os usuários mock
# Nota: Em desenvolvimento, os usuários de teste da tela de login são criados automaticamente ao iniciar o servidor
```

---

## 🎯 **Próximos Passos**

### **Sprint 6: Testing Suite** (Próximo)
- [ ] Unit tests com coverage > 80%
- [ ] Integration tests para APIs
- [ ] E2E tests com Playwright

### **Sprint 7: Expanded CRUD**
- [ ] Interfaces completas para alunos, professores, cursos
- [ ] Formulários avançados com validação
- [ ] Upload de documentos

### **Sprint 8: Business Features**
- [ ] Sistema de notas e avaliações
- [ ] Controle de frequência
- [ ] Relatórios acadêmicos

**Para roadmap completo:** [📋 Project Specs](./docs/project-specs.md)

---

## 🚢 **Deploy em Produção**

O sistema está **production-ready** para deploy no Coolify:

```bash
# Environment Variables necessárias
DATABASE_URL=postgresql://user:pass@db:5432/seminario_db
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret
NODE_ENV=production
```

**Para guia completo de deploy:** [🚀 Production Ready](./docs/producao.md)

---

## 📈 **Monitoramento**

### **Endpoints de Saúde**
- **`/health`** - Status básico
- **`/health/detailed`** - Detalhes do sistema
- **`/health/database`** - Status do PostgreSQL
- **`/metrics`** - Métricas Prometheus

### **Documentação API**
- **`/docs`** - Swagger UI completo
- **`/api-docs.json`** - OpenAPI specification

---

## 🆘 **Suporte**

### **Dados Mock para Desenvolvimento**
O sistema inclui dados mock em `apps/api/src/data/mock-users.ts` para:
- ✅ Usuários com diferentes roles
- ✅ Credenciais consistentes para testes
- ✅ Fallback offline no frontend

### **Troubleshooting**
1. **JWT Warning:** Configure `JWT_SECRET` no `.env`
2. **Banco não conecta:** Verifique se PostgreSQL está rodando
3. **Frontend offline:** Sistema usa mock data automaticamente

### **Logs e Debug**
```bash
# Ver logs estruturados
pnpm --filter @seminario/api run dev

# Health check
curl http://localhost:4000/health
```

---

## 🏆 **Status do Projeto**

**🎉 CONQUISTA:** Sistema utilizável por usuários finais implementado!

- ✅ **Backend Production-Ready** - 17 tabelas + APIs + Auth + Security
- ✅ **Frontend Funcional** - React + Auth + CRUD + Responsive
- ✅ **Full-Stack Integration** - Sistema end-to-end funcionando
- ✅ **Deploy Ready** - Configurado para Coolify
- ✅ **Documentation** - Swagger + Specs completas

**🎯 Achievement:** 5 de 11 sprints completos - Sistema já utilizável!

**Para detalhes completos:** [📊 Progress Tracker](./docs/progress-tracker.md)

---

## 📄 **Licença**

Este projeto é propriedade do **Seminário Presbiteriano de Jesus**.

---

**🎯 Desenvolvido para o Seminário Presbiteriano de Jesus**  
**📊 Status:** Sistema Full-Stack Funcional  
**🚀 Next:** Expandir funcionalidades CRUD  

**Última atualização:** 11/01/2025