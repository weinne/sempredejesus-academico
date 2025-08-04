import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { User, CreateUser, UpdateUser, ChangePassword, Role, Pessoa } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User as UserIcon,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const userSchema = z.object({
  pessoaId: z.number().min(1, 'Selecione uma pessoa'),
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres').max(50),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  role: z.nativeEnum(Role),
  isActive: z.enum(['S', 'N']).default('S'),
});

const updateUserSchema = userSchema.partial().omit({ password: true });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function UsersPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [page, setPage] = useState(1);

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

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    formState: { errors: errorsUpdate },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Fetch pessoas for the dropdown
  const {
    data: pessoas = [],
  } = useQuery({
    queryKey: ['pessoas'],
    queryFn: apiService.getPessoas,
  });

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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (user: CreateUser) => apiService.createUser(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário criado',
        description: 'Usuário criado com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUser }) =>
      apiService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário atualizado',
        description: 'Usuário atualizado com sucesso!',
      });
      setShowForm(false);
      setEditingUser(null);
      resetUpdate();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar usuário',
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
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover usuário',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ id, passwords }: { id: number; passwords: ChangePassword }) =>
      apiService.changePassword(id, passwords),
    onSuccess: () => {
      toast({
        title: 'Senha alterada',
        description: 'Senha alterada com sucesso!',
      });
      setShowPasswordForm(false);
      setSelectedUser(null);
      resetPassword();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter users by search term
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.pessoa?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      const { password, ...updateData } = data;
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const onPasswordSubmit = (data: ChangePasswordFormData) => {
    if (selectedUser) {
      changePasswordMutation.mutate({ id: selectedUser.id, passwords: data });
    }
  };

  // Handle edit
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
    resetUpdate({
      pessoaId: user.pessoaId,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle new user
  const handleNew = () => {
    setEditingUser(null);
    setShowForm(true);
    reset();
  };

  // Handle change password
  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setShowPasswordForm(true);
    resetPassword();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
                <p className="text-sm text-gray-600">Criação, edição e controle de acesso de usuários</p>
              </div>
            </div>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Buscar Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Busque por username, nome ou role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* User Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingUser ? handleSubmitUpdate(onSubmit) : handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pessoa *
                      </label>
                      <select
                        {...(editingUser ? registerUpdate('pessoaId') : register('pessoaId'))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${(editingUser ? errorsUpdate.pessoaId : errors.pessoaId) ? 'border-red-500' : ''}`}
                      >
                        <option value="">Selecione uma pessoa...</option>
                        {pessoas.map((pessoa) => (
                          <option key={pessoa.id} value={pessoa.id}>
                            {pessoa.nome} {pessoa.email ? `(${pessoa.email})` : ''}
                          </option>
                        ))}
                      </select>
                      {(editingUser ? errorsUpdate.pessoaId : errors.pessoaId) && (
                        <p className="mt-1 text-sm text-red-600">{(editingUser ? errorsUpdate.pessoaId : errors.pessoaId)?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username *
                      </label>
                      <Input
                        {...(editingUser ? registerUpdate('username') : register('username'))}
                        className={(editingUser ? errorsUpdate.username : errors.username) ? 'border-red-500' : ''}
                      />
                      {(editingUser ? errorsUpdate.username : errors.username) && (
                        <p className="mt-1 text-sm text-red-600">{(editingUser ? errorsUpdate.username : errors.username)?.message}</p>
                      )}
                    </div>

                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Senha *
                        </label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            className={errors.password ? 'border-red-500' : ''}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        {...(editingUser ? registerUpdate('role') : register('role'))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${(editingUser ? errorsUpdate.role : errors.role) ? 'border-red-500' : ''}`}
                      >
                        <option value="">Selecione uma role...</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="SECRETARIA">Secretaria</option>
                        <option value="PROFESSOR">Professor</option>
                        <option value="ALUNO">Aluno</option>
                      </select>
                      {(editingUser ? errorsUpdate.role : errors.role) && (
                        <p className="mt-1 text-sm text-red-600">{(editingUser ? errorsUpdate.role : errors.role)?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        {...(editingUser ? registerUpdate('isActive') : register('isActive'))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="S">Ativo</option>
                        <option value="N">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingUser ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingUser(null);
                        reset();
                        resetUpdate();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Change Password Form */}
          {showPasswordForm && selectedUser && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Alterar Senha - {selectedUser.username}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha Atual *
                      </label>
                      <Input
                        type="password"
                        {...registerPassword('currentPassword')}
                        className={errorsPassword.currentPassword ? 'border-red-500' : ''}
                      />
                      {errorsPassword.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{errorsPassword.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nova Senha *
                      </label>
                      <Input
                        type="password"
                        {...registerPassword('newPassword')}
                        className={errorsPassword.newPassword ? 'border-red-500' : ''}
                      />
                      {errorsPassword.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{errorsPassword.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Senha *
                      </label>
                      <Input
                        type="password"
                        {...registerPassword('confirmPassword')}
                        className={errorsPassword.confirmPassword ? 'border-red-500' : ''}
                      />
                      {errorsPassword.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errorsPassword.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                    >
                      Alterar Senha
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setSelectedUser(null);
                        resetPassword();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Usuários Cadastrados ({filteredUsers.length})
              </CardTitle>
              <CardDescription>
                Lista de todos os usuários cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900 truncate">
                              {user.username}
                            </h3>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleChangePassword(user)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Pessoa:</span>
                            <span className="truncate">{user.pessoa?.nome || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{user.pessoa?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.isActive === 'S' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive === 'S' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}