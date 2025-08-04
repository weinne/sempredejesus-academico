import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { Role } from '@/types/api';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, Calendar, FileText, Settings, User } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, hasRole } = useAuth();

  const adminActions = [
    { title: 'Gerenciar Pessoas', description: 'Cadastrar e editar pessoas', href: '/pessoas', icon: Users },
    { title: 'Gerenciar Alunos', description: 'Visualizar e editar alunos', href: '/alunos', icon: GraduationCap },
    { title: 'Gerenciar Professores', description: 'Visualizar e editar professores', href: '/professores', icon: User },
    { title: 'Gerenciar Cursos', description: 'Cadastrar e editar cursos', href: '/cursos', icon: BookOpen },
    { title: 'Gerenciar Turmas', description: 'Organizar turmas e disciplinas', href: '/turmas', icon: Calendar },
    { title: 'Relatórios', description: 'Visualizar relatórios gerenciais', href: '/relatorios', icon: FileText },
    { title: 'Configurações', description: 'Configurações do sistema', href: '/config', icon: Settings },
  ];

  const secretariaActions = [
    { title: 'Gerenciar Pessoas', description: 'Cadastrar e editar pessoas', href: '/pessoas', icon: Users },
    { title: 'Gerenciar Alunos', description: 'Visualizar e editar alunos', href: '/alunos', icon: GraduationCap },
    { title: 'Gerenciar Professores', description: 'Visualizar professores', href: '/professores', icon: User },
    { title: 'Gerenciar Cursos', description: 'Visualizar cursos', href: '/cursos', icon: BookOpen },
    { title: 'Gerenciar Turmas', description: 'Organizar turmas', href: '/turmas', icon: Calendar },
    { title: 'Relatórios', description: 'Visualizar relatórios', href: '/relatorios', icon: FileText },
  ];

  const professorActions = [
    { title: 'Minhas Turmas', description: 'Visualizar turmas que leciono', href: '/turmas', icon: Calendar },
    { title: 'Meus Alunos', description: 'Visualizar alunos das minhas turmas', href: '/alunos', icon: GraduationCap },
    { title: 'Meu Portal', description: 'Informações pessoais', href: '/meu-portal', icon: User },
  ];

  const alunoActions = [
    { title: 'Minhas Notas', description: 'Visualizar minhas notas', href: '/meu-portal', icon: FileText },
    { title: 'Meu Curso', description: 'Informações do meu curso', href: '/cursos', icon: BookOpen },
    { title: 'Meu Portal', description: 'Informações pessoais', href: '/meu-portal', icon: User },
  ];

  const getActionsForRole = () => {
    switch (user?.role) {
      case Role.ADMIN:
        return adminActions;
      case Role.SECRETARIA:
        return secretariaActions;
      case Role.PROFESSOR:
        return professorActions;
      case Role.ALUNO:
        return alunoActions;
      default:
        return [];
    }
  };

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

  const actions = getActionsForRole();

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

          {/* Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link to={action.href} className="block">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{action.description}</CardDescription>
                    </CardContent>
                  </Link>
                </Card>
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