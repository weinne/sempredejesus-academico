import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { PageHeaderProvider, usePageHeader } from '@/providers/page-header-provider';
import { HeroSection } from '@/components/ui/hero-section';
import { cn } from '@/lib/utils';
import { Role } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronRight,
  Users as UsersIcon,
  Settings as SettingsIcon,
  UserCircle2,
  GraduationCap,
  User as UserIcon,
  BookOpen,
  Layers3,
  BarChart3,
  CalendarDays,
  FileText,
  ClipboardList,
  LogOut,
  Menu as MenuIcon,
  Pin as PinIcon,
  PinOff as PinOffIcon,
  ListOrdered,
  Clock,
  FileSpreadsheet,
  Home,
  X,
  Shield,
  TrendingUp,
  Activity,
  Zap,
  ArrowUp,
  CheckSquare,
} from 'lucide-react';

type SectionKey = 'administracao' | 'gestao' | 'registros' | 'pessoal';

function AppLayoutContent() {
  const navigate = useNavigate();
  const { logout, hasRole } = useAuth();
  const { headerConfig, setOnMenuClick } = usePageHeader();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isPinned, setIsPinned] = React.useState<boolean>(false);
  const [openSections, setOpenSections] = React.useState<Record<SectionKey, boolean>>({
    administracao: true,
    gestao: true,
    registros: true,
    pessoal: true,
  });
  const [showScrollTop, setShowScrollTop] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Passa a função de abrir menu para o context
  React.useEffect(() => {
    setOnMenuClick(() => () => setIsOpen(true));
  }, [setOnMenuClick]);

  const toggleSection = (key: SectionKey) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const menuSections = [
    {
      key: 'administracao',
      title: 'Administração',
      items: [
        { to: '/pessoas', icon: UsersIcon, label: 'Pessoas', visible: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { to: '/users', icon: UsersIcon, label: 'Usuários', visible: hasRole(Role.ADMIN) },
        { to: '/config', icon: SettingsIcon, label: 'Configurações', visible: hasRole(Role.ADMIN) },
      ],
    },
    {
      key: 'gestao',
      title: 'Gestão Acadêmica',
      items: [
        { to: '/alunos', icon: GraduationCap, label: 'Alunos', visible: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { to: '/professores', icon: UserIcon, label: 'Professores', visible: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { to: '/cursos', icon: BookOpen, label: 'Cursos', visible: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { to: '/turnos', icon: Clock, label: 'Turnos', visible: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { to: '/curriculos', icon: FileSpreadsheet, label: 'Currículos', visible: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { to: '/coortes', icon: GraduationCap, label: 'Coortes', visible: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { to: '/periodos', icon: ListOrdered, label: 'Períodos', visible: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { to: '/disciplinas', icon: BookOpen, label: 'Disciplinas', visible: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { to: '/turmas', icon: Layers3, label: 'Turmas', visible: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { to: '/relatorios', icon: BarChart3, label: 'Relatórios', visible: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
      ],
    },
    {
      key: 'registros',
      title: 'Registros',
      items: [
        { to: '/aulas', icon: CalendarDays, label: 'Aulas', visible: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { to: '/frequencia', icon: CheckSquare, label: 'Frequência em Massa', visible: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { to: '/avaliacoes', icon: FileText, label: 'Avaliações', visible: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { to: '/presencas', icon: ClipboardList, label: 'Presenças', visible: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
      ],
    },
    {
      key: 'pessoal',
      title: 'Pessoal',
      items: [
        { to: '/meu-portal', icon: UserCircle2, label: 'Meu Portal', visible: true },
      ],
      extra: true,
    },
  ] as const;

  const sidebar = (
    <aside
      className={cn(
        'w-72 h-full bg-white border-r border-slate-200/60 shadow-xl',
        isPinned ? 'sticky top-0 hidden md:block' : 'fixed left-0 top-0 z-50'
      )}
      aria-label="Menu lateral"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/60 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-sm">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm">Sistema Acadêmico</span>
            <p className="text-xs text-slate-500">Seminário Presbiteriano</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPinned((v) => !v)}
            className="hidden md:inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isPinned ? 'Desafixar' : 'Fixar'}
          >
            {isPinned ? <PinOffIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
          </button>
          {!isPinned && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div 
        className="flex-1 overflow-y-auto p-3 space-y-1" 
        style={{ 
          maxHeight: 'calc(100vh - 64px)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(203 213 225) rgb(241 245 249)',
          scrollBehavior: 'smooth'
        }}
      >
        <nav className="space-y-1">
        {/* Dashboard Link */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all group',
              isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                isActive 
                  ? 'bg-white/20' 
                  : 'bg-slate-100 group-hover:bg-slate-200'
              )}>
                <Home className={cn(
                  'h-4 w-4',
                  isActive ? 'text-white' : 'text-slate-600'
                )} />
              </div>
              <span>Dashboard</span>
            </>
          )}
        </NavLink>

        {/* Sections */}
        {menuSections.map((section) => {
          const items = section.items.filter((it) => it.visible);
          if (items.length === 0) return null;
          
          const sectionIcons = {
            administracao: Shield,
            gestao: TrendingUp,
            registros: Activity,
            pessoal: UserCircle2,
          };
          
          const SectionIcon = sectionIcons[section.key as keyof typeof sectionIcons];
          
          return (
            <Section
              key={section.key}
              title={section.title}
              icon={SectionIcon}
              isOpen={openSections[section.key as SectionKey]}
              onToggle={() => toggleSection(section.key as SectionKey)}
            >
              {items.map((it) => (
                <NavItem key={it.to} to={it.to} icon={it.icon} label={it.label} />
              ))}

              {section.key === 'pessoal' && (
                <>
                  <a
                    href="#alterar-senha"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/meu-portal#alterar-senha');
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                      <SettingsIcon className="h-4 w-4 text-slate-600" />
                    </div>
                    <span>Alterar Senha</span>
                  </a>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                      <LogOut className="h-4 w-4 text-red-600 group-hover:text-red-700" />
                    </div>
                    <span>Sair</span>
                  </button>
                </>
              )}
            </Section>
          );
        })}
        </nav>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      {isPinned ? (
        <div className="flex">
          {sidebar}
          <div className="flex-1 min-w-0 md:ml-0">
            {/* Hero integrado */}
            {headerConfig && (
              <HeroSection
                {...headerConfig}
                showMenuButton={true}
                onMenuClick={() => setIsOpen(true)}
              />
            )}
            <main>
              <Outlet />
            </main>
          </div>
        </div>
      ) : (
        <>
          {/* Overlay drawer */}
          <div
            className={cn(
              'fixed inset-0 z-40 bg-black/40 transition-opacity',
              isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              'fixed left-0 top-0 z-50 h-full w-72 transform transition-transform',
              isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {sidebar}
          </div>
          
          <div className="min-w-0">
            {!headerConfig && (
              <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200/60 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(true)}
                  aria-label="Abrir menu"
                >
                  <MenuIcon className="h-5 w-5" />
                </Button>
                <span className="text-sm font-semibold text-slate-700">Menu</span>
                <div className="w-9" />
              </div>
            )}

            {/* Hero integrado com botão de menu */}
            {headerConfig && (
              <HeroSection
                {...headerConfig}
                onMenuClick={() => setIsOpen(true)}
                showMenuButton={true}
              />
            )}
            <main>
              <Outlet />
            </main>
          </div>
        </>
      )}

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center rounded-full bg-slate-900 text-white shadow-lg p-3 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function AppLayout() {
  return (
    <PageHeaderProvider>
      <AppLayoutContent />
    </PageHeaderProvider>
  );
}

function Section({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ComponentType<any>;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-3 text-left text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
            <Icon className="h-4 w-4 text-slate-600" />
          </div>
          <span>{title}</span>
        </div>
        <div className="h-6 w-6 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </button>
      {isOpen && <div className="ml-11 space-y-1">{children}</div>}
    </div>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<any>; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all group',
          isActive 
            ? 'bg-slate-900 text-white shadow-sm font-medium' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        )
      }
      end
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
            isActive 
              ? 'bg-white/20' 
              : 'bg-slate-100 group-hover:bg-slate-200'
          )}>
            <Icon className={cn(
              'h-4 w-4',
              isActive ? 'text-white' : 'text-slate-600'
            )} />
          </div>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}


