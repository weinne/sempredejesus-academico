# 📖 Documentação da API - Swagger/OpenAPI

## ✅ **IMPLEMENTAÇÃO CONCLUÍDA**

### 🔧 **Configuração Técnica**
- **Swagger JSDoc** 📝 - Documentação inline no código
- **Swagger UI Express** 🌐 - Interface web interativa  
- **OpenAPI 3.0.0** 🎯 - Padrão moderno de documentação

### 📍 **Endpoints de Documentação**
- **Interface Web**: `http://localhost:4000/docs`
- **Especificação JSON**: `http://localhost:4000/api-docs.json`

### 📚 **Documentação Implementada - TODOS OS ENDPOINTS**

#### 🔐 **Autenticação (Auth)**
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/refresh` - Renovação de token  
- `POST /api/auth/logout` - Logout com blacklist

#### 👥 **Pessoas**
- `GET /api/pessoas` - Listar pessoas
- `POST /api/pessoas` - Criar pessoa (ADMIN/SECRETARIA)
- `GET /api/pessoas/{id}` - Buscar por ID
- `PATCH /api/pessoas/{id}` - Atualizar (ADMIN/SECRETARIA)
- `DELETE /api/pessoas/{id}` - Remover (ADMIN/SECRETARIA)

#### 👨‍🏫 **Professores**
- `GET /api/professores` - Listar professores
- `POST /api/professores` - Criar professor (ADMIN/SECRETARIA)
- `GET /api/professores/{matricula}` - Buscar por matrícula
- `PATCH /api/professores/{matricula}` - Atualizar (ADMIN/SECRETARIA)
- `DELETE /api/professores/{matricula}` - Remover (ADMIN/SECRETARIA)

#### 👨‍🎓 **Alunos**
- `GET /api/alunos` - Listar alunos
- `POST /api/alunos` - Criar aluno (ADMIN/SECRETARIA)
- `GET /api/alunos/{ra}` - Buscar por RA
- `PATCH /api/alunos/{ra}` - Atualizar (ADMIN/SECRETARIA)
- `DELETE /api/alunos/{ra}` - Remover (ADMIN/SECRETARIA)

#### 📚 **Cursos**
- `GET /api/cursos` - Listar cursos
- `POST /api/cursos` - Criar curso (ADMIN/SECRETARIA)
- `GET /api/cursos/{id}` - Buscar por ID
- `PATCH /api/cursos/{id}` - Atualizar (ADMIN/SECRETARIA)
- `DELETE /api/cursos/{id}` - Remover (ADMIN/SECRETARIA)

#### 📖 **Disciplinas**
- `GET /api/disciplinas` - Listar disciplinas
- `POST /api/disciplinas` - Criar disciplina (ADMIN/SECRETARIA)
- `GET /api/disciplinas/{id}` - Buscar por ID
- `PATCH /api/disciplinas/{id}` - Atualizar (ADMIN/SECRETARIA)
- `DELETE /api/disciplinas/{id}` - Remover (ADMIN/SECRETARIA)

#### 🏫 **Turmas**
- `GET /api/turmas` - Listar turmas
- `POST /api/turmas` - Criar turma (ADMIN/SECRETARIA/PROFESSOR)
- `GET /api/turmas/{id}` - Buscar por ID
- `PATCH /api/turmas/{id}` - Atualizar (ADMIN/SECRETARIA/PROFESSOR)
- `DELETE /api/turmas/{id}` - Remover (ADMIN/SECRETARIA/PROFESSOR)

#### ❤️ **Health Check**
- `GET /health` - Status básico da API
- `GET /health/detailed` - Status detalhado (database, memória)

### 🏗️ **Estrutura dos Schemas**

#### **Todas as Entidades Documentadas**
- ✅ `Pessoa` & `CreatePessoa` - Schema completo com validações
- ✅ `Professor` & `CreateProfessor` - Gestão de professores
- ✅ `Aluno` & `CreateAluno` - Gestão de alunos
- ✅ `Curso` & `CreateCurso` - Gestão de cursos
- ✅ `Disciplina` & `CreateDisciplina` - Gestão de disciplinas  
- ✅ `Turma` & `CreateTurma` - Gestão de turmas
- ✅ `LoginRequest/Response` - Schemas de autenticação
- ✅ `ErrorResponse` & `SuccessResponse` - Respostas padronizadas

### 🔒 **Sistema de Segurança Documentado**

#### **Bearer Authentication**
```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

#### **Controle de Roles Documentado**
- **GET** endpoints: Todos usuários autenticados
- **POST/PATCH/DELETE**: Permissões específicas por role
- **Códigos de erro**: 401 (Não autorizado), 403 (Sem permissão)

### ⚙️ **Configuração do Swagger**

#### **Servers Configurados**
- **Desenvolvimento**: `http://localhost:4000`
- **Produção**: `https://api.seminario.edu`

#### **Tags Organizadas**
- 🔐 Auth - Autenticação e autorização
- 👥 Pessoas - Gerenciamento de pessoas
- 👨‍🏫 Professores - Gerenciamento de professores  
- 👨‍🎓 Alunos - Gerenciamento de alunos
- 📚 Cursos - Gerenciamento de cursos
- 📖 Disciplinas - Gerenciamento de disciplinas
- 🏫 Turmas - Gerenciamento de turmas
- ❤️ Health - Verificação de saúde

### 🎨 **Customizações da Interface**

#### **UI Melhorada**
- Topbar removida para interface limpa
- Título customizado: "Sistema Acadêmico Seminário - API Docs"
- Autenticação persistente
- Filtros e extensões habilitados
- Duração de requests visível

### 📋 **Exemplos Completos**

#### **Todas as operações incluem:**
- ✅ Descrições detalhadas
- ✅ Exemplos de request/response
- ✅ Códigos de status HTTP
- ✅ Schemas de validação
- ✅ Requisitos de autenticação
- ✅ Permissões por role

### 🚀 **Como Usar**

#### **Para Desenvolvedores:**
1. Acesse `http://localhost:4000/docs`
2. Use "Authorize" para inserir JWT token
3. Teste endpoints diretamente na interface
4. Veja exemplos e schemas em tempo real

#### **Para Frontend/Mobile:**
1. Use `http://localhost:4000/api-docs.json` para gerar SDKs
2. Importe no Postman/Insomnia
3. Use como referência para integração

### 🎯 **Benefícios Implementados**

#### **Para Equipe de Desenvolvimento:**
- 📖 Documentação sempre atualizada
- 🧪 Testes diretos na interface
- 🎯 Especificações precisas
- 🔄 Sincronização código-documentação

#### **Para Integrações:**
- 🤖 Geração automática de SDKs
- 📱 Facilita desenvolvimento mobile
- 🌐 Padronização de API REST
- 🔍 Descoberta de endpoints

---

## ✅ **STATUS: DOCUMENTAÇÃO COMPLETA E FUNCIONAL**

A documentação Swagger/OpenAPI está **100% implementada** e pronta para uso profissional! 🎉 