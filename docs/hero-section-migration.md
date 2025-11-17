# Migração Hero Section + CrudHeader

## Resumo

O componente `HeroSection` foi atualizado para incluir a funcionalidade do `CrudHeader`, eliminando redundância de títulos e melhorando a UX em todas as telas (desktop, tablet e mobile).

## Mudanças no HeroSection

### Novas props

```typescript
interface HeroSectionProps {
  // ... props existentes
  backTo?: string;           // URL para voltar (padrão: navigate(-1))
  showBackButton?: boolean;  // Mostrar botão voltar (padrão: true)
}
```

### Layout integrado

**Antes:**
```tsx
<CrudHeader title="Gerenciar Turmas" backTo="/dashboard" actions={...} />
<HeroSection title="Gestão das turmas acadêmicas" description="..." stats={...} />
```

**Depois:**
```tsx
<HeroSection
  title="Gestão das turmas acadêmicas"
  description="..."
  backTo="/dashboard"
  stats={...}
  actions={...}
/>
```

## Estrutura visual

```
┌─────────────────────────────────────────────────────────────┐
│ [←] [Badge]                            [Nova Turma] (desktop)│
│     Título Principal                                         │
│     Descrição da página                                      │
├─────────────────────────────────────────────────────────────┤
│ 1 Total de Turmas  3 Disciplinas     [Actions] (mobile)     │
│ 1 Professores      0 Inscritos       Ver disciplinas →      │
└─────────────────────────────────────────────────────────────┘
```

## Comportamento responsivo

### Desktop (lg+)
- Botão voltar + título à esquerda
- Actions principais à direita (mesmo nível do título)
- Stats na linha inferior

### Tablet/Mobile
- Botão voltar + título empilhados
- Stats na linha inferior
- Actions movidos para linha inferior (junto com stats)

## Migração de páginas

### Exemplo: Turmas

**Antes:**
```tsx
<CrudHeader
  title="Gerenciar Turmas"
  backTo="/dashboard"
  actions={canCreate ? (
    <Button onClick={() => navigate('/turmas/new')}>
      <Plus className="h-4 w-4 mr-2" />
      Nova Turma
    </Button>
  ) : undefined}
/>

<HeroSection
  badge="Ofertas Acadêmicas"
  title="Gestão das turmas acadêmicas"
  description="Configure e gerencie as turmas oferecidas..."
  stats={[...]}
  actionLink={{
    href: '/disciplinas',
    label: 'Ver disciplinas'
  }}
/>
```

**Depois:**
```tsx
<HeroSection
  title="Gestão das turmas acadêmicas"
  description="Configure e gerencie as turmas oferecidas..."
  backTo="/dashboard"
  stats={[...]}
  actionLink={{
    href: '/disciplinas',
    label: 'Ver disciplinas'
  }}
  actions={canCreate ? (
    <Button onClick={() => navigate('/turmas/new')}>
      <Plus className="h-4 w-4 mr-2" />
      Nova Turma
    </Button>
  ) : undefined}
/>
```

## Páginas a migrar

- [x] Turmas (/turmas)
- [ ] Usuários (/users)
- [ ] Turnos (/turnos)
- [ ] Coortes (/coortes)
- [ ] Disciplinas (/disciplinas)
- [ ] Alunos (/alunos)
- [ ] Cursos (/cursos)
- [ ] Professores (/professores)
- [ ] Períodos (/periodos)
- [ ] Currículos (/curriculos)
- [ ] Pessoas (/pessoas)

## Notas importantes

1. **Badge removido por padrão**: O badge não é mais necessário na maioria dos casos. Use apenas se agregar valor real.

2. **Título único**: Use apenas o título descritivo (ex: "Gestão das turmas acadêmicas"), não o título de navegação (ex: "Gerenciar Turmas").

3. **Actions flexível**: Pode receber múltiplos botões ou elementos customizados.

4. **Responsividade automática**: O componente se adapta automaticamente a diferentes tamanhos de tela.

## Benefícios

- ✅ Elimina redundância de títulos
- ✅ Reduz ~30% do espaço vertical
- ✅ Layout mais limpo e profissional
- ✅ Melhor UX em mobile e tablet
- ✅ Um componente menos para importar

