# Migração Segura para Produção

## Problema Resolvido
O erro de perda de dados foi resolvido removendo o `NOT NULL` das colunas `periodo_id` nas tabelas `disciplinas` e `alunos`.

## Mudanças Aplicadas

### Schema Atualizado
- `apps/api/src/db/schema/alunos.ts`: `periodoId` agora é opcional
- `apps/api/src/db/schema/disciplinas.ts`: `periodoId` agora é opcional

### SQL Gerado
```sql
ALTER TABLE "alunos" ALTER COLUMN "periodo_id" DROP NOT NULL;
ALTER TABLE "disciplinas" ALTER COLUMN "periodo_id" DROP NOT NULL;
```

## Como Aplicar em Produção

### Opção 1: Usando drizzle-kit (Recomendado)
```bash
# Na produção, executar:
pnpm db:push
```

### Opção 2: SQL Direto
```sql
-- Aplicar apenas as mudanças necessárias
ALTER TABLE "alunos" ALTER COLUMN "periodo_id" DROP NOT NULL;
ALTER TABLE "disciplinas" ALTER COLUMN "periodo_id" DROP NOT NULL;
```

## Vantagens da Solução

1. **Sem Perda de Dados**: Registros existentes não precisam de valor padrão
2. **Flexibilidade**: Novos registros podem ser criados sem período inicialmente
3. **Compatibilidade**: Sistema continua funcionando normalmente
4. **Simplicidade**: Apenas 2 comandos SQL simples

## Próximos Passos (Opcional)

Se desejar tornar as colunas obrigatórias no futuro:

1. Criar períodos padrão para todos os cursos existentes
2. Atualizar registros existentes para usar os períodos padrão
3. Aplicar NOT NULL novamente

```sql
-- Exemplo para o futuro (quando necessário):
INSERT INTO periodos (curso_id, numero, nome)
SELECT id, 1, 'Período 1' FROM cursos
ON CONFLICT (curso_id, numero) DO NOTHING;

UPDATE disciplinas 
SET periodo_id = p.id 
FROM periodos p 
WHERE p.curso_id = disciplinas.curso_id 
  AND p.numero = 1 
  AND disciplinas.periodo_id IS NULL;

UPDATE alunos 
SET periodo_id = p.id 
FROM periodos p 
WHERE p.curso_id = alunos.curso_id 
  AND p.numero = 1 
  AND alunos.periodo_id IS NULL;

-- Só então aplicar NOT NULL:
ALTER TABLE disciplinas ALTER COLUMN periodo_id SET NOT NULL;
ALTER TABLE alunos ALTER COLUMN periodo_id SET NOT NULL;
```

## Status
✅ **Pronto para produção** - Sem riscos de perda de dados
