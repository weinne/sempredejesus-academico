import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { User, Role, Pessoa } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, Trash2, User as UserIcon, Mail, Key, Eye, UserPlus, Plus, Shield, ArrowLeft, Users, CheckCircle, XCircle, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import PessoaFormModal from '@/components/modals/pessoa-form-modal';
import { usePageHero } from '@/hooks/use-page-hero';
import { StatCard } from '@/components/ui/stats-card';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';

export default function UsersPage() {
  const { hasRole, user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showPessoaModal, setShowPessoaModal] = useState(false);
  // Automaticamente usar cards em telas menores para evitar barra de rolagem lateral
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'card' : 'table'
  );
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      // Em telas menores que 1024px, usar cards automaticamente
      if (window.innerWidth < 1024) {
        setViewMode('card');
      } else {
        // Só permitir tabela em telas grandes (>= 1024px)
        setViewMode('table');
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const canEdit = hasRole([Role.ADMIN]);

  // Check if user has admin role - this page requires admin access
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h2>
              <p className="text-gray-600">Você precisa de permissão de ADMIN para acessar esta página.</p>
              <Link to="/dashboard">
                <Button className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const onResize = () => {
      // Em telas menores que 1024px, usar cards automaticamente
      if (window.innerWidth < 1024) {
        setViewMode('card');
      } else {
        // Só permitir tabela em telas grandes (>= 1024px)
        setViewMode('table');
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Fetch users
  const {
    data: usersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users', page, searchTerm],
    queryFn: () => apiService.getUsers({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'id',
      sortOrder: 'asc'
    }),
    retry: false,
  });

  const users = usersResponse?.data || [];
  const pagination = usersResponse?.pagination;
  const canChangePasswordForUser = (target: User) => target.role !== Role.ADMIN || target.id === currentUser?.id;
  const adminPasswordRestriction = 'Somente o próprio administrador pode alterar sua senha.';

  const handleNew = () => navigate('/users/new');

  // Configure Hero via hook
  usePageHero({
    title: "Gestão completa de usuários",
    description: "Crie e gerencie todos os usuários do sistema com seus perfis, permissões e controle de acesso.",
    backTo: "/dashboard",
    stats: [
      { value: pagination?.total || 0, label: 'Total de Usuários' },
      { value: users.filter(u => u.role === 'ADMIN').length, label: 'Administradores' },
      { value: users.filter(u => u.role === 'PROFESSOR').length, label: 'Professores' },
      { value: users.filter(u => u.role === 'ALUNO').length, label: 'Alunos' }
    ],
    actionLink: {
      href: '/pessoas',
      label: 'Ver pessoas'
    },
    actions: (
      <>
        <Button variant="outline" onClick={() => setShowPessoaModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nova Pessoa
        </Button>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </>
    )
  });

  // Create Pessoa mutation (for quick person creation)
  const createPessoaMutation = useMutation({
    mutationFn: (pessoa: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>) =>
      apiService.createPessoa(pessoa),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({
        title: 'Pessoa cadastrada',
        description: `Pessoa ${created.nome} criada com sucesso!`,
      });
      setShowPessoaModal(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cadastrar pessoa',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário removido',
        description: 'Usuário removido com sucesso!',
      });
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    },
    onError: (error: any) => {
      // Verificar se é erro de restrição de FK
      if (error.response?.status === 409 || 
          error.message?.includes('foreign key') || 
          error.message?.includes('constraint') ||
          error.message?.includes('violates foreign key')) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este usuário possui dados relacionados (aluno ou professor). Remova primeiro os dados relacionados para poder excluir o usuário.',
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setDeletingUser(null);
        return;
      }
      
      toast({
        title: 'Erro ao remover usuário',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    },
  });

  // Filter users by search term
  const search = (searchTerm || '').toLowerCase();
  const filteredUsers = users.filter((u) => {
    const username = (u?.username || '').toString().toLowerCase();
    const pessoaNome = ((u as any)?.pessoa?.nome || (u as any)?.pessoa?.nomeCompleto || '').toString().toLowerCase();
    const roleStr = (typeof u?.role === 'string' ? u.role : '').toString().toLowerCase();
    return username.includes(search) || pessoaNome.includes(search) || roleStr.includes(search);
  });

  const handleEdit = (user: User) => navigate(`/users/edit/${user.id}`);

  // Handle delete
  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };
  const handleChangePassword = (user: User) => {
    if (!canChangePasswordForUser(user)) {
      toast({
        title: 'Ação não permitida',
        description: adminPasswordRestriction,
        variant: 'destructive',
      });
      return;
    }
    navigate(`/users/edit/${user.id}#password`);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'SECRETARIA': return 'bg-blue-100 text-blue-800';
      case 'PROFESSOR': return 'bg-green-100 text-green-800';
      case 'ALUNO': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar dados</h2>
              <p className="text-gray-600">Não foi possível conectar com o servidor.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Filtros */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">Filtros e Busca</h2>
                <p className="text-sm text-slate-500">Encontre usuários por username, nome ou role</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Buscar</label>
                  <input
                    type="text"
                    placeholder="Busque por username, nome ou role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-96 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={() => setSearchTerm('')}>
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total de Usuários"
              value={users.length}
              icon={Users}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Administradores"
              value={users.filter(u => u.role === 'ADMIN').length}
              icon={Shield}
              iconColor="text-red-600"
            />
            <StatCard
              title="Professores"
              value={users.filter(u => u.role === 'PROFESSOR').length}
              icon={UserIcon}
              iconColor="text-green-600"
            />
            <StatCard
              title="Alunos"
              value={users.filter(u => u.role === 'ALUNO').length}
              icon={UserIcon}
              iconColor="text-yellow-600"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usuários Cadastrados ({users.length})</CardTitle>
              <CardDescription>Lista de todos os usuários cadastrados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={users}
                viewMode={viewMode}
                isLoading={isLoading}
                columns={[
                  { key: 'username', header: 'Username' },
                  { key: 'pessoa', header: 'Pessoa', render: (u: any) => u?.pessoa?.nome || 'N/A' },
                  { key: 'email', header: 'Email', render: (u: any) => u?.pessoa?.email || 'N/A' },
                  { key: 'role', header: 'Role', render: (u: any) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>{u.role}</span>
                  ) },
                  { key: 'isActive', header: 'Status', render: (u: any) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive === 'S' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.isActive === 'S' ? 'Ativo' : 'Inativo'}
                    </span>
                  ) },
                  { key: 'actions', header: 'Ações', render: (u: User) => (
                    <div className="flex items-center gap-1">
                      <Link to={`/users/view/${u.id}`} title="Visualizar">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Link to={`/users/edit/${u.id}`} title="Editar">
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleChangePassword(u)}
                        title={canChangePasswordForUser(u) ? 'Alterar senha' : adminPasswordRestriction}
                        disabled={!canChangePasswordForUser(u)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(u)} disabled={deleteMutation.isPending} title="Remover">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) },
                ]}
                cardRender={(u: any) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <h3 className="font-semibold text-gray-900 truncate">{u.username}</h3>
                        </div>
                        <div className="flex space-x-1">
                          <Link to={`/users/view/${u.id}`} title="Visualizar">
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          <Link to={`/users/edit/${u.id}`} title="Editar">
                            <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChangePassword(u)}
                            title={canChangePasswordForUser(u) ? 'Alterar senha' : adminPasswordRestriction}
                            disabled={!canChangePasswordForUser(u)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(u)} disabled={deleteMutation.isPending} title="Remover">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Pessoa:</span>
                          <span className="truncate">{u.pessoa?.nome || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{u.pessoa?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>{u.role}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive === 'S' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {u.isActive === 'S' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                emptyState={
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</p>
                  </div>
                }
              />

              <Pagination
                page={page}
                totalPages={pagination?.totalPages || 0}
                onChange={setPage}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <PessoaFormModal
        isOpen={showPessoaModal}
        onClose={() => setShowPessoaModal(false)}
        isLoading={createPessoaMutation.isPending}
        onSubmit={async (data) => {
          await createPessoaMutation.mutateAsync({
            nome: data.nome,
            sexo: (data as any).sexo,
            email: data.email,
            cpf: data.cpf,
            telefone: data.telefone,
            endereco: data.endereco,
            data_nascimento: data.data_nascimento,
          } as any);
        }}
      />

      {/* Dialog para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingUser(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{deletingUser?.username || ((deletingUser as any)?.pessoa?.nome || '')}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingUser(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}