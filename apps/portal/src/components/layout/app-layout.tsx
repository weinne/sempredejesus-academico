import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import { Role } from '@/types/api';
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
} from 'lucide-react';

type SectionKey = 'administracao' | 'gestao' | 'registros' | 'pessoal';

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout, hasRole } = useAuth();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isPinned, setIsPinned] = React.useState<boolean>(false);
  const [openSections, setOpenSections] = React.useState<Record<SectionKey, boolean>>({
    administracao: true,
    gestao: true,
    registros: true,
    pessoal: true,
  });

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
        'w-72 h-full bg-white border-r shadow-sm',
        isPinned ? 'sticky top-0 hidden md:block' : 'fixed left-0 top-0 z-50'
      )}
      aria-label="Menu lateral"
    >
      <div className="h-14 flex items-center justify-between px-4 border-b">
        <span className="font-semibold">Sistema Acadêmico</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPinned((v) => !v)}
            className="hidden md:inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            title={isPinned ? 'Desafixar' : 'Fixar'}
          >
            {isPinned ? <PinOffIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
            <span>{isPinned ? 'Desafixar' : 'Fixar'}</span>
          </button>
        </div>
      </div>

      <nav className="p-2 space-y-2">
          {menuSections.map((section) => {
            const items = section.items.filter((it) => it.visible);
            if (items.length === 0) return null;
            return (
              <Section
                key={section.key}
                title={section.title}
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
                      className={cn(
                        'flex items-center gap-2 rounded px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                      )}
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Alterar Senha</span>
                    </a>
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full text-left flex items-center gap-2 rounded px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </>
                )}
              </Section>
            );
          })}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hamburger button */}
      {!isPinned && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed top-3 left-3 z-40 inline-flex items-center gap-2 rounded-md bg-white/90 border px-3 py-2 shadow-sm hover:bg-white"
          aria-label="Abrir menu"
        >
          <MenuIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Menu</span>
        </button>
      )}

      {/* Sidebar */}
      {isPinned ? (
        <div className="flex">
          {sidebar}
          <main className="flex-1 min-w-0 md:ml-0">
            <Outlet />
          </main>
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
          <main className="min-w-0">
            <Outlet />
          </main>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-md">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium"
        onClick={onToggle}
      >
        <span>{title}</span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && <div className="px-2 pb-2 space-y-1">{children}</div>}
    </div>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<any>; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded px-2.5 py-2 text-sm hover:bg-muted transition-colors',
          isActive ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
        )
      }
      end
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}


