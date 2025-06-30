# API Specification - Sistema Acadêmico

## Base URL
- **Development:** `http://localhost:4000/api`
- **Production:** `https://api.seminario.org.br/api`

## Autenticação

Todos os endpoints (exceto `/auth/login`) requerem autenticação via JWT Bearer Token.

```http
Authorization: Bearer <jwt-token>
```

### Roles e Permissões

| Endpoint | ADMIN | SECRETARIA | PROFESSOR | ALUNO |
|----------|-------|------------|-----------|-------|
| `/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `/pessoas` | ✅ | ✅ | ❌ | ❌ |
| `/alunos` | ✅ | ✅ | ❌ | 📖 (próprios dados) |
| `/professores` | ✅ | ✅ | 📖 | ❌ |
| `/cursos` | ✅ | ✅ | 📖 | 📖 |
| `/disciplinas` | ✅ | ✅ | 📖 | 📖 |
| `/turmas` | ✅ | ✅ | 📖 (próprias turmas) | 📖 (turmas matriculadas) |
| `/avaliacoes` | ✅ | ✅ | ✏️ (próprias turmas) | 📖 (próprias notas) |

**Legenda:** ✅ Full Access | 📖 Read Only | ✏️ Read/Write Limited | ❌ No Access

## Endpoints Principais

### 🔐 Autenticação

#### POST `/auth/login`
Efetua login no sistema.

```json
{
  "email": "admin@seminario.edu",
  "password": "admin123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "nome": "Admin User",
      "email": "admin@seminario.edu",
      "role": "ADMIN"
    }
  }
}
```

#### POST `/auth/refresh`
Renova o token de acesso.

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/auth/logout`
Efetua logout (limpa cookies).

### 👥 Pessoas

#### GET `/pessoas`
Lista pessoas com paginação e filtros.

**Query Parameters:**
- `page` - Página (default: 1)
- `limit` - Itens por página (default: 10, max: 100)
- `search` - Busca em nome, email, CPF
- `filter` - Filtros: `sexo:eq:M`, `email:like:@seminario`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nomeCompleto": "João Silva Santos",
      "sexo": "M",
      "email": "joao@seminario.edu",
      "cpf": "12345678901",
      "dataNasc": "1990-05-15",
      "telefone": "11999999999",
      "endereco": {
        "logradouro": "Rua das Flores, 123",
        "cidade": "São Paulo",
        "estado": "SP",
        "cep": "01234-567"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

#### GET `/pessoas/:id`
Busca pessoa por ID.

#### POST `/pessoas`
Cria nova pessoa.

```json
{
  "nomeCompleto": "Maria Santos Silva",
  "sexo": "F",
  "email": "maria@email.com",
  "cpf": "98765432101",
  "dataNasc": "1985-03-20",
  "telefone": "11888888888",
  "endereco": {
    "logradouro": "Av. Paulista, 456",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  }
}
```

#### PATCH `/pessoas/:id`
Atualiza pessoa (campos opcionais).

#### DELETE `/pessoas/:id`
Remove pessoa.

### 🎓 Alunos

#### GET `/alunos`
Lista alunos (ADMIN/SECRETARIA).

#### GET `/alunos/:ra`
Busca aluno por RA.

**Response:**
```json
{
  "success": true,
  "data": {
    "ra": "20240001",
    "pessoaId": 1,
    "cursoId": 1,
    "anoIngresso": 2024,
    "igreja": "Igreja Presbiteriana Central",
    "situacao": "ATIVO",
    "coeficienteAcad": "8.50",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### POST `/alunos`
Cria novo aluno.

```json
{
  "ra": "20240002",
  "pessoaId": 2,
  "cursoId": 1,
  "anoIngresso": 2024,
  "igreja": "Igreja Presbiteriana do Brasil",
  "situacao": "ATIVO"
}
```

### 👨‍🏫 Professores

#### GET `/professores`
Lista professores.

#### GET `/professores/:matricula`
Busca professor por matrícula.

#### POST `/professores`
Cria novo professor.

```json
{
  "matricula": "PROF0001",
  "pessoaId": 3,
  "dataInicio": "2024-01-01",
  "formacaoAcad": "Doutor em Teologia",
  "situacao": "ATIVO"
}
```

### 📚 Cursos

#### GET `/cursos`
Lista cursos disponíveis.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Bacharel em Teologia",
      "grau": "Bacharel"
    }
  ]
}
```

#### POST `/cursos`
Cria novo curso.

```json
{
  "nome": "Mestrado em Teologia",
  "grau": "Mestrado"
}
```

### 📖 Disciplinas

#### GET `/disciplinas`
Lista disciplinas.

**Query Parameters:**
- `filter` - Ex: `cursoId:eq:1`, `ativo:eq:true`

#### POST `/disciplinas`
Cria nova disciplina.

```json
{
  "cursoId": 1,
  "codigo": "TEO001",
  "nome": "Introdução à Teologia",
  "creditos": 4,
  "cargaHoraria": 60,
  "ementa": "Conceitos fundamentais da teologia cristã...",
  "bibliografia": "BERKHOF, Louis. Teologia Sistemática...",
  "ativo": true
}
```

### 🏫 Turmas

#### GET `/turmas`
Lista turmas.

**Query Parameters:**
- `filter` - Ex: `semestreId:eq:20241`, `professorId:eq:PROF0001`

#### GET `/turmas/:id`
Detalhes da turma com alunos inscritos.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "disciplinaId": 1,
    "professorId": "PROF0001",
    "semestreId": 20241,
    "sala": "101",
    "horario": "Segunda 19:00-22:00",
    "secao": "A",
    "inscritos": [
      {
        "id": 1,
        "alunoId": "20240001",
        "status": "MATRICULADO",
        "media": null,
        "frequencia": null
      }
    ]
  }
}
```

### 📝 Avaliações

#### GET `/avaliacoes`
Lista avaliações por turma.

**Query Parameters:**
- `turmaId` - ID da turma (obrigatório)

#### POST `/avaliacoes`
Cria nova avaliação.

```json
{
  "turmaId": 1,
  "data": "2024-03-15",
  "tipo": "PROVA",
  "codigo": "P1",
  "descricao": "Primeira Prova",
  "peso": 30,
  "arquivoUrl": "https://exemplo.com/prova1.pdf"
}
```

#### POST `/avaliacoes/:id/notas`
Lança notas dos alunos.

```json
{
  "notas": [
    {
      "alunoId": "20240001",
      "nota": 8.5,
      "obs": "Excelente desempenho"
    }
  ]
}
```

### 📊 Relatórios

#### GET `/reports/historico`
Histórico acadêmico do aluno.

**Query Parameters:**
- `alunoId` - RA do aluno

#### GET `/reports/frequencia`
Relatório de frequência por turma.

**Query Parameters:**
- `turmaId` - ID da turma
- `startDate` - Data inicial (YYYY-MM-DD)
- `endDate` - Data final (YYYY-MM-DD)

#### GET `/reports/desempenho`
Relatório de desempenho por disciplina.

**Query Parameters:**
- `disciplinaId` - ID da disciplina
- `semestreId` - ID do semestre

### 📁 Upload

#### POST `/upload`
Upload de arquivos.

**Content-Type:** `multipart/form-data`

```
file: (arquivo)
type: "document" | "image" | "avatar"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://exemplo.com/uploads/arquivo.pdf",
    "filename": "arquivo.pdf",
    "size": 2048576,
    "type": "application/pdf"
  }
}
```

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Erro de validação |
| 401 | Não autenticado |
| 403 | Não autorizado |
| 404 | Recurso não encontrado |
| 422 | Erro de entidade |
| 429 | Muitas requisições |
| 500 | Erro interno do servidor |

## Rate Limiting

- **Limite:** 100 requisições por 15 minutos por IP
- **Headers de resposta:**
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp do reset

## Paginação

Todos os endpoints de listagem suportam paginação:

```
GET /api/alunos?page=2&limit=20
```

**Response Headers:**
```
X-Total-Count: 150
X-Total-Pages: 8
```

## Filtros Avançados

Formato: `filter=campo:operador:valor`

**Operadores disponíveis:**
- `eq` - Igual
- `like` - Contém (case-insensitive)
- `gte` - Maior ou igual
- `lte` - Menor ou igual

**Exemplos:**
```
GET /api/alunos?filter=situacao:eq:ATIVO
GET /api/pessoas?filter=nome:like:silva,sexo:eq:M
GET /api/avaliacoes?filter=data:gte:2024-01-01,tipo:eq:PROVA
```

## WebSocket (Futuro)

Planejado para notificações em tempo real:
- Novas avaliações
- Alterações de notas
- Avisos acadêmicos

## Documentação Interativa

Acesse a documentação Swagger em: `GET /docs`

---

📚 **Gerado automaticamente via zod-to-openapi** | Versão da API: 1.0.0 