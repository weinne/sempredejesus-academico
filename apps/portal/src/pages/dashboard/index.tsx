import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { Role } from '@/types/api';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, Calendar, FileText, Settings, User, Layers3, BarChart3, CalendarDays, ClipboardList, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, hasRole } = useAuth();
  
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
        // Pessoas removido do dashboard; acessível via menu lateral (Administração)
        { title: 'Alunos', description: 'Visualizar e editar alunos', href: '/alunos', icon: GraduationCap, show: hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]) },
        { title: 'Professores', description: 'Visualizar e editar professores', href: '/professores', icon: User, show: hasRole([Role.ADMIN, Role.SECRETARIA]) },
        { title: 'Cursos', description: 'Cadastrar e editar cursos', href: '/cursos', icon: BookOpen, show: hasRole([Role.ADMIN, Role.SECRETARIA]) },
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
        { title: 'Meu Portal', description: 'Informações pessoais', href: '/meu-portal', icon: User, show: true },
        { title: 'Alterar Senha', description: 'Atualizar sua senha de acesso', href: '/meu-portal#alterar-senha', icon: Settings, show: true },
        { title: 'Sair', description: 'Encerrar sessão atual', href: '#logout', icon: LogOut, show: true, onClick: () => logout() },
      ],
    },
  ] as const;

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema Acadêmico</h1>
              <p className="text-sm text-gray-600">Seminário Presbiteriano de Jesus</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.pessoa?.nome || user?.username}</p>
                <p className="text-xs text-gray-500">{user?.role && getRoleDisplayName(user.role)}</p>
              </div>
              <Link to="/meu-portal" className="hidden sm:block">
                <Button variant="secondary">Meu Portal</Button>
              </Link>
              <Link to="/meu-portal#alterar-senha" className="hidden sm:block">
                <Button variant="outline">Alterar Senha</Button>
              </Link>
              <Button variant="outline" onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Card */}
          <Card className="mb-8">
            <CardHeader>
                              <CardTitle>Bem-vindo(a), {user?.pessoa?.nome || user?.username}!</CardTitle>
              <CardDescription>
                Você está logado como {user?.role && getRoleDisplayName(user.role)}. 
                Selecione uma das opções abaixo para começar.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section) => {
              const visibleItems = section.items.filter((i) => i.show);
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.key}>
                  <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleItems.map((item, idx) => {
                      const Icon = item.icon;
                      const content = (
                        <>
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-5 w-5 text-blue-600" />
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription>{item.description}</CardDescription>
                          </CardContent>
                        </>
                      );
                      return (
                        <Card key={idx} className="hover:shadow-md transition-shadow">
                          {'onClick' in item && item.onClick ? (
                            <button
                              type="button"
                              onClick={item.onClick}
                              className="w-full text-left"
                            >
                              {content}
                            </button>
                          ) : (
                            <Link to={item.href} className="block">
                              {content}
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

          {/* System Status */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Sistema funcionando normalmente</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}