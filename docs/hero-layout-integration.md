# Integração Hero + Layout - Solução Elegante

## Problema Original

O botão do menu hamburguer (flutuante no layout) estava sobrepondo elementos do Hero, criando confusão visual e UX problems em mobile/tablet.

## Solução Implementada

### Arquitetura Nova

```
┌─────────────────────────────────────────────────────────────┐
│                    AppLayout (Provider)                      │
├─────────────────────────────────────────────────────────────┤
│  PageHeaderProvider Context                                  │
│  ├── Header Config (título, descrição, stats, actions)      │
│  └── onMenuClick handler                                     │
├─────────────────────────────────────────────────────────────┤
│  HeroSection (renderizado pelo layout)                       │
│  ├── Mobile: ☰ integrado no Hero                            │
│  ├── Desktop: ← Voltar + conteúdo                           │
│  └── Stats + Actions responsivos                            │
├─────────────────────────────────────────────────────────────┤
│  <Outlet /> - Conteúdo da página                            │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Criados

#### 1. **PageHeaderProvider** (`providers/page-header-provider.tsx`)
Context que permite que páginas configurem o Hero de forma declarativa:

```tsx
interface PageHeaderConfig {
  badge?: string;
  title: string;
  description: string;
  stats?: StatItem[];
  actionLink?: { href: string; label: string };
  actions?: ReactNode;
  backTo?: string;
  showBackButton?: boolean;
}
```

#### 2. **usePageHero** (`hooks/use-page-hero.ts`)
Hook que simplifica a configuração do Hero:

```tsx
usePageHero({
  title: "Gestão das turmas acadêmicas",
  description: "Configure e gerencie as turmas...",
  backTo: "/dashboard",
  stats: [
    { value: 100, label: 'Total' },
    // ...
  ],
  actions: <Button>Nova Turma</Button>
});
```

#### 3. **HeroSection atualizado**
Novas props para integração com o layout:

```tsx
interface HeroSectionProps {
  // ... props existentes
  onMenuClick?: () => void;        // Handler para abrir menu
  showMenuButton?: boolean;        // Mostrar botão de menu
}
```

#### 4. **AppLayout atualizado**
- Envolvido com `PageHeaderProvider`
- Remove botão hamburguer flutuante
- Renderiza Hero automaticamente quando configurado
- Passa `onMenuClick` para o Hero via context

### Comportamento Responsivo

#### Mobile/Tablet
```
[←] Título da Página                   [Actions]
    Descrição
─────────────────────────────────────────────────
1 Total   3 Disciplinas   Ver disciplinas →
```
- Apenas botão voltar (navegação simples)
- Sem menu hamburguer (navegação via voltar)
- Layout limpo e organizado

#### Desktop
```
☰ [←] Título da Página                 [Actions]
      Descrição
─────────────────────────────────────────────────
1 Total   3 Disciplinas   Ver disciplinas →
```
- Menu hamburguer + botão voltar lado a lado
- Permite abrir/fechar sidebar a qualquer momento
- Navegação rápida com voltar

### Uso nas Páginas

**Antes** (Hero inline em cada página):
```tsx
<CrudHeader ... />
<HeroSection ... />
<main>...</main>
```

**Depois** (configuração via hook):
```tsx
export default function TurmasPage() {
  // ... queries e estado
  
  usePageHero({
    title: "Gestão das turmas acadêmicas",
    description: "...",
    stats: [...],
    actions: <Button>...</Button>
  });
  
  return <main>...</main>;  // Hero renderizado automaticamente!
}
```

## Benefícios

✅ **Elimina sobreposição**: Menu integrado ao Hero, não mais flutuante  
✅ **Código mais limpo**: Páginas configuram Hero via hook  
✅ **Sem redundância**: Um único Hero renderizado pelo layout  
✅ **Responsividade perfeita**: Comportamento adaptativo automático  
✅ **Manutenibilidade**: Lógica centralizada no layout  
✅ **Consistência**: Todas as páginas seguem o mesmo padrão  

## Migração de Páginas

### Passo a passo

1. **Remover** imports do `CrudHeader` e `HeroSection`
2. **Adicionar** import do `usePageHero`
3. **Substituir** JSX do Hero por chamada ao hook
4. **Remover** wrapper `<div className="min-h-screen bg-slate-50">` da página

### Exemplo: Turmas

```tsx
// ❌ Antes
<div className="min-h-screen bg-slate-50">
  <CrudHeader ... />
  <HeroSection ... />
  <main>...</main>
</div>

// ✅ Depois
usePageHero({
  title: "...",
  // ...
});

<main>...</main>
```

## Páginas Migradas

- [x] Turmas (/turmas)

## Próximas Migrações

- [ ] Usuários (/users)
- [ ] Disciplinas (/disciplinas)
- [ ] Alunos (/alunos)
- [ ] Professores (/professores)
- [ ] Cursos (/cursos)
- [ ] Turnos (/turnos)
- [ ] Coortes (/coortes)
- [ ] Períodos (/periodos)
- [ ] Currículos (/curriculos)
- [ ] Pessoas (/pessoas)
- [ ] Calendário (/calendario)

## Notas Técnicas

1. **Context vs Props Drilling**: Usamos Context para evitar passar props por múltiplos níveis
2. **Cleanup automático**: O hook limpa a configuração quando o componente desmonta
3. **Type Safety**: Todas as interfaces são tipadas com TypeScript
4. **Performance**: O Hero só re-renderiza quando a configuração muda

## Troubleshooting

### Hero não aparece
- Verifique se o AppLayout está envolvido com PageHeaderProvider
- Confirme que usePageHero está sendo chamado no componente da página

### Menu não abre
- Verifique se onMenuClick está sendo passado corretamente no AppLayout
- Confirme que showMenuButton está true em mobile

### Stats não atualizam
- Verifique as dependências do useEffect no usePageHero
- Use valores derivados das queries diretamente no hook

