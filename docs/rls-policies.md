# Row-Level Security (RLS) Policies

O sistema implementa Row-Level Security no PostgreSQL para garantir que usuários acessem apenas os dados aos quais têm permissão, baseado em seus roles e contexto.

## Visão Geral

### Roles do Sistema

1. **ADMIN** - Acesso total a todos os dados
2. **SECRETARIA** - Acesso geral aos dados acadêmicos
3. **PROFESSOR** - Acesso limitado às suas turmas e alunos
4. **ALUNO** - Acesso apenas aos próprios dados

### Implementação

As políticas RLS são declaradas em SQL e aplicadas automaticamente pelo PostgreSQL em todas as queries, independente da aplicação.

## Políticas por Tabela

### 📋 pessoas

```sql
-- Política para ADMIN: acesso total
CREATE POLICY admin_pessoas_all ON pessoas
  FOR ALL TO app_role
  USING (current_setting('app.user_role') = 'ADMIN');

-- Política para SECRETARIA: acesso total
CREATE POLICY secretaria_pessoas_all ON pessoas
  FOR ALL TO app_role
  USING (current_setting('app.user_role') = 'SECRETARIA');

-- Política para PROFESSOR: apenas leitura de pessoas relacionadas às suas turmas
CREATE POLICY professor_pessoas_read ON pessoas
  FOR SELECT TO app_role
  USING (
    current_setting('app.user_role') = 'PROFESSOR' AND
    id IN (
      SELECT DISTINCT p.id 
      FROM pessoas p
      JOIN alunos a ON a.pessoa_id = p.id
      JOIN turmas_inscritos ti ON ti.aluno_id = a.ra
      JOIN turmas t ON t.id = ti.turma_id
      WHERE t.professor_id = current_setting('app.user_id')
    )
  );

-- Política para ALUNO: apenas próprios dados
CREATE POLICY aluno_pessoas_own ON pessoas
  FOR SELECT TO app_role
  USING (
    current_setting('app.user_role') = 'ALUNO' AND
    id::text = current_setting('app.user_id')
  );
```

### 🎓 alunos

```sql
-- ADMIN e SECRETARIA: acesso total
CREATE POLICY admin_secretaria_alunos_all ON alunos
  FOR ALL TO app_role
  USING (current_setting('app.user_role') IN ('ADMIN', 'SECRETARIA'));

-- PROFESSOR: apenas alunos de suas turmas
CREATE POLICY professor_alunos_turmas ON alunos
  FOR SELECT TO app_role
  USING (
    current_setting('app.user_role') = 'PROFESSOR' AND
    ra IN (
      SELECT ti.aluno_id
      FROM turmas_inscritos ti
      JOIN turmas t ON t.id = ti.turma_id
      WHERE t.professor_id = current_setting('app.user_id')
    )
  );

-- ALUNO: apenas próprios dados
CREATE POLICY aluno_alunos_own ON alunos
  FOR SELECT TO app_role
  USING (
    current_setting('app.user_role') = 'ALUNO' AND
    pessoa_id::text = current_setting('app.user_id')
  );
```

### 👨‍🏫 professores

```sql
-- ADMIN e SECRETARIA: acesso total
CREATE POLICY admin_secretaria_professores_all ON professores
  FOR ALL TO app_role
  USING (current_setting('app.user_role') IN ('ADMIN', 'SECRETARIA'));

-- PROFESSOR: apenas próprios dados e colegas (leitura)
CREATE POLICY professor_professores_read ON professores
  FOR SELECT TO app_role
  USING (current_setting('app.user_role') = 'PROFESSOR');

CREATE POLICY professor_professores_own ON professores
  FOR UPDATE TO app_role
  USING (
    current_setting('app.user_role') = 'PROFESSOR' AND
    pessoa_id::text = current_setting('app.user_id')
  );
```

### 🏫 turmas

```sql
-- ADMIN e SECRETARIA: acesso total
CREATE POLICY admin_secretaria_turmas_all ON turmas
  FOR ALL TO app_role
  USING (current_setting('app.user_role') IN ('ADMIN', 'SECRETARIA'));

-- PROFESSOR: apenas suas turmas
CREATE POLICY professor_turmas_own ON turmas
  FOR ALL TO app_role
  USING (
    current_setting('app.user_role') = 'PROFESSOR' AND
    professor_id = current_setting('app.user_id')
  );

-- ALUNO: apenas turmas onde está matriculado
CREATE POLICY aluno_turmas_matriculado ON turmas
  FOR SELECT TO app_role
  USING (
    current_setting('app.user_role') = 'ALUNO' AND
    id IN (
      SELECT t.id
      FROM turmas t
      JOIN turmas_inscritos ti ON ti.turma_id = t.id
      JOIN alunos a ON a.ra = ti.aluno_id
      WHERE a.pessoa_id::text = current_setting('app.user_id')
    )
  );
```

### 📝 turmas_inscritos

```sql
-- ADMIN e SECRETARIA: acesso total
CREATE POLICY admin_secretaria_inscricoes_all ON turmas_inscritos
  FOR ALL TO app_role
  USING (current_setting('app.user_role') IN ('ADMIN', 'SECRETARIA'));

-- PROFESSOR: inscrições de suas turmas
CREATE POLICY professor_inscricoes_turmas ON turmas_inscritos
  FOR ALL TO app_role
  USING (
    current_setting('app.user_role') = 'PROFESSOR' AND
    turma_id IN (
      SELECT id FROM turmas 
      WHERE professor_id = current_setting('app.user_id')
    )
  );

-- ALUNO: apenas próprias inscrições
CREATE POLICY aluno_inscricoes_own ON turmas_inscritos
  FOR SELECT TO app_role
  USING (
    current_setting('app.user_role') = 'ALUNO' AND
    aluno_id IN (
      SELECT ra FROM alunos 
      WHERE pessoa_id::text = current_setting('app.user_id')
    )
  );
```

### 📚 avaliacoes

```sql
-- ADMIN e SECRETARIA: acesso total
CREATE POLICY admin_secretaria_avaliacoes_all ON avaliacoes
  FOR ALL TO app_role
  USING (current_setting('app.user_role') IN ('ADMIN', 'SECRETARIA'));

-- PROFESSOR: avaliações de suas turmas
CREATE POLICY professor_avaliacoes_turmas ON avaliacoes
  FOR ALL TO app_role
  USING (
    current_setting('app.user_role') = 'PROFESSOR' AND
    turma_id IN (
      SELECT id FROM turmas 
      WHERE professor_id = current_setting('app.user_id')
    )
  );

-- ALUNO: apenas avaliações de turmas onde está matriculado
CREATE POLICY aluno_avaliacoes_turmas ON avaliacoes
  FOR SELECT TO app_role
  USING (
    current_setting('app.user_role') = 'ALUNO' AND
    turma_id IN (
      SELECT t.id
      FROM turmas t
      JOIN turmas_inscritos ti ON ti.turma_id = t.id
      JOIN alunos a ON a.ra = ti.aluno_id
      WHERE a.pessoa_id::text = current_setting('app.user_id')
    )
  );
```

### 📊 avaliacoes_alunos

```sql
-- ADMIN e SECRETARIA: acesso total
CREATE POLICY admin_secretaria_notas_all ON avaliacoes_alunos
  FOR ALL TO app_role
  USING (current_setting('app.user_role') IN ('ADMIN', 'SECRETARIA'));

-- PROFESSOR: notas de avaliações de suas turmas
CREATE POLICY professor_notas_turmas ON avaliacoes_alunos
  FOR ALL TO app_role
  USING (
    current_setting('app.user_role') = 'PROFESSOR' AND
    avaliacao_id IN (
      SELECT av.id
      FROM avaliacoes av
      JOIN turmas t ON t.id = av.turma_id
      WHERE t.professor_id = current_setting('app.user_id')
    )
  );

-- ALUNO: apenas próprias notas
CREATE POLICY aluno_notas_own ON avaliacoes_alunos
  FOR SELECT TO app_role
  USING (
    current_setting('app.user_role') = 'ALUNO' AND
    aluno_id IN (
      SELECT ra FROM alunos 
      WHERE pessoa_id::text = current_setting('app.user_id')
    )
  );
```

### ✅ frequencias

```sql
-- ADMIN e SECRETARIA: acesso total
CREATE POLICY admin_secretaria_frequencias_all ON frequencias
  FOR ALL TO app_role
  USING (current_setting('app.user_role') IN ('ADMIN', 'SECRETARIA'));

-- PROFESSOR: frequências de suas turmas
CREATE POLICY professor_frequencias_turmas ON frequencias
  FOR ALL TO app_role
  USING (
    current_setting('app.user_role') = 'PROFESSOR' AND
    inscricao_id IN (
      SELECT ti.id
      FROM turmas_inscritos ti
      JOIN turmas t ON t.id = ti.turma_id
      WHERE t.professor_id = current_setting('app.user_id')
    )
  );

-- ALUNO: apenas próprias frequências
CREATE POLICY aluno_frequencias_own ON frequencias
  FOR SELECT TO app_role
  USING (
    current_setting('app.user_role') = 'ALUNO' AND
    inscricao_id IN (
      SELECT ti.id
      FROM turmas_inscritos ti
      JOIN alunos a ON a.ra = ti.aluno_id
      WHERE a.pessoa_id::text = current_setting('app.user_id')
    )
  );
```

## Configuração da Sessão

### Context Variables

As políticas RLS dependem de variáveis de contexto da sessão:

```sql
-- Definir role do usuário
SET app.user_role = 'PROFESSOR';

-- Definir ID do usuário
SET app.user_id = 'PROF0001';
```

### Implementação na API

No middleware de autenticação, definimos o contexto:

```typescript
// Após validar o JWT
await db.execute(sql`SET app.user_role = ${user.role}`);
await db.execute(sql`SET app.user_id = ${user.sub}`);
```

## Habilitação do RLS

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas_inscritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

-- Tabelas públicas (sem RLS)
-- cursos, disciplinas, semestres, calendario, configuracoes
```

## Role de Aplicação

```sql
-- Criar role para a aplicação
CREATE ROLE app_role;

-- Conceder permissões básicas
GRANT CONNECT ON DATABASE seminario_db TO app_role;
GRANT USAGE ON SCHEMA public TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_role;
```

## Vantagens do RLS

### 🔒 Segurança

- **Proteção nativa:** Impossível contornar via SQL injection
- **Zero-trust:** Dados protegidos independente do código da aplicação
- **Auditoria:** Logs nativos do PostgreSQL

### 🚀 Performance

- **Índices otimizados:** PostgreSQL otimiza queries com RLS
- **Cache eficiente:** Planos de query reutilizados
- **Menos código:** Reduz lógica de autorização na aplicação

### 🔧 Manutenção

- **Centralizada:** Todas as regras em um local
- **Declarativa:** Políticas expressas em SQL
- **Testável:** Políticas podem ser testadas isoladamente

## Monitoramento

### Logs de Acesso

```sql
-- Habilitar logs de RLS
SET log_row_security = on;
SET log_statement = 'all';
```

### Views de Auditoria

```sql
-- View para monitorar políticas ativas
CREATE VIEW rls_policies AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public';
```

## Troubleshooting

### Problemas Comuns

1. **Política muito restritiva:**
   ```sql
   -- Verificar contexto da sessão
   SELECT current_setting('app.user_role');
   SELECT current_setting('app.user_id');
   ```

2. **Performance lenta:**
   ```sql
   -- Analisar plano de query
   EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM alunos;
   ```

3. **Conflito de políticas:**
   ```sql
   -- Listar políticas ativas
   SELECT * FROM rls_policies WHERE tablename = 'alunos';
   ```

### Teste de Políticas

```sql
-- Simular contexto de usuário
BEGIN;
SET LOCAL app.user_role = 'ALUNO';
SET LOCAL app.user_id = '1';

-- Testar query
SELECT * FROM alunos;
-- Deve retornar apenas dados do aluno logado

ROLLBACK;
```

---

🔐 **Implementação robusta de segurança em nível de dados** | PostgreSQL RLS + JWT 