import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { Role } from '@/types/api';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, Calendar, FileText, Settings, User, Layers3, BarChart3, CalendarDays, ClipboardList, LogOut, ListOrdered, Clock, FileSpreadsheet, ArrowRight, TrendingUp, Activity, Shield, Zap } from 'lucide-react';
import { usePageHero } from '@/hooks/use-page-hero';

const getRoleDisplayName = (role: Role): string => {
  switch (role) {
    case Role.ADMIN:
      return 'Administrador';
    case Role.SECRETARIA:
      return 'Secretaria';
    case Role.PROFESSOR:
      return 'Professor';
    case Role.ALUNO:
      return 'Aluno';
    default:
      return role;
  }
};

export default function DashboardPage() {
  const { user, logout, hasRole } = useAuth();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);
  const roleDisplayName = user?.role ? getRoleDisplayName(user.role) : undefined;

  const heroActions = useMemo(
    () => (
      <div className="flex gap-2">
        <Link to="/meu-portal">
          <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
            <User className="h-4 w-4 mr-1.5" />
            Meu Portal
          </Button>
        </Link>
        <Button variant="secondary" size="sm" onClick={logout} className="bg-white/20 border-white/20 text-white hover:bg-white/30">
          <LogOut className="h-4 w-4 mr-1.5" />
          Sair
        </Button>
      </div>
    ),
    [logout]
  );

  usePageHero({
    badge: roleDisplayName,
    title: `Bem-vindo(a), ${user?.pessoa?.nome || user?.username || 'usuário'}!`,
    description: 'Sistema de Gestão Acadêmica do Seminário Presbiteriano de Jesus. Acesse as funcionalidades disponíveis para seu perfil abaixo.',
    actions: heroActions,
    showBackButton: false,
  });
  
  const sections = [
    {
      key: 'administracao',
      title: 'Administração',
      items: [
        { title: 'Usuários', description: 'Gerenciar contas de acesso', href: '/users', icon: Users, show: hasRole(Role.ADMIN) },
        { title: 'Configurações', description: 'Configurações do sistema', href: '/config', icon: Settings, show: hasRole(Role.ADMIN) },
      ],
    },
    {
      key: 'gestao',
      title: 'Gestão Acadêmica',
      items: [
        // Pessoas removido do dashboard; acessvel via menu lateral (Administrao)
        { title: 'Alunos', description: 'Visualizar e editar alunos', href: '/alunos', icon: GraduationCap, show: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { title: 'Professores', description: 'Visualizar e editar professores', href: '/professores', icon: User, show: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { title: 'Cursos', description: 'Cadastrar e editar cursos', href: '/cursos', icon: BookOpen, show: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { title: 'Turnos', description: 'Gerenciar turnos acadêmicos', href: '/turnos', icon: Clock, show: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { title: 'Currículos', description: 'Gerenciar versões de currículo', href: '/curriculos', icon: FileSpreadsheet, show: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { title: 'Coortes', description: 'Gerenciar turmas de ingresso', href: '/coortes', icon: GraduationCap, show: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { title: 'Períodos', description: 'Gerenciar períodos acadmicos', href: '/periodos', icon: ListOrdered, show: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { title: 'Disciplinas', description: 'Cadastrar e editar disciplinas', href: '/disciplinas', icon: BookOpen, show: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { title: 'Turmas', description: 'Organizar turmas e disciplinas', href: '/turmas', icon: Layers3, show: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { title: 'Relatórios', description: 'Visualizar relatórios gerenciais', href: '/relatorios', icon: BarChart3, show: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
      ],
    },
    {
      key: 'registros',
      title: 'Registros',
      items: [
        { title: 'Aulas', description: 'Visualizar e gerenciar aulas', href: '/aulas', icon: CalendarDays, show: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { title: 'Avaliações', description: 'Visualizar e gerenciar avaliações', href: '/avaliacoes', icon: FileText, show: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { title: 'Presenças', description: 'Gerenciar registros de presença', href: '/presencas', icon: ClipboardList, show: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
      ],
    },
    {
      key: 'pessoal',
      title: 'Pessoal',
      items: [
        { title: 'Meu Portal', description: 'Informaes pessoais', href: '/meu-portal', icon: User, show: true },
        { title: 'Alterar Senha', description: 'Atualizar sua senha de acesso', href: '/meu-portal#alterar-senha', icon: Settings, show: true },
        { title: 'Sair', description: 'Encerrar sesso atual', href: '#logout', icon: LogOut, show: true, onClick: () => logout() },
      ],
    },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section) => {
            const visibleItems = section.items.filter((i) => i.show);
            if (visibleItems.length === 0) return null;
            
            return (
              <div key={section.key} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    {section.key === 'administracao' && <Shield className="h-4 w-4 text-slate-600" />}
                    {section.key === 'gestao' && <TrendingUp className="h-4 w-4 text-slate-600" />}
                    {section.key === 'registros' && <Activity className="h-4 w-4 text-slate-600" />}
                    {section.key === 'pessoal' && <User className="h-4 w-4 text-slate-600" />}
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900">{section.title}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visibleItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <Card key={idx} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm hover:shadow-slate-200/50">
                        {'onClick' in item && item.onClick ? (
                          <button
                            type="button"
                            onClick={item.onClick}
                            className="w-full text-left p-6 space-y-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                                <Icon className="h-6 w-6 text-slate-600" />
                              </div>
                              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-semibold text-slate-900 text-lg">{item.title}</h3>
                              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                            </div>
                          </button>
                        ) : (
                          <Link to={item.href} className="block p-6 space-y-4 group">
                            <div className="flex items-start justify-between">
                              <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                                <Icon className="h-6 w-6 text-slate-600" />
                              </div>
                              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-semibold text-slate-900 text-lg">{item.title}</h3>
                              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                            </div>
                          </Link>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mt-12 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades mais utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {canEdit && (
                <Link to="/cursos">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Gerenciar Cursos</div>
                        <div className="text-sm text-slate-500">Visualizar e editar cursos</div>
                      </div>
                    </div>
                  </Button>
                </Link>
              )}
              <Link to="/relatorios">
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    <div className="text-left">
                      <div className="font-medium">Relatórios</div>
                      <div className="text-sm text-slate-500">Análises e estatísticas</div>
                    </div>
                  </div>
                </Button>
              </Link>
              <Link to="/meu-portal">
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium">Meu Portal</div>
                      <div className="text-sm text-slate-500">Informações pessoais</div>
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}