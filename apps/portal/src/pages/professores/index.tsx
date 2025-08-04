import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Professor, CreateProfessorWithUser, Pessoa, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookOpen,
  Award,
  Briefcase,
  Eye,
  EyeOff
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const professorSchema = z.object({
  matricula: z.string().length(8, 'Matrícula deve ter 8 caracteres'),
  pessoaId: z.number().min(1, 'Selecione uma pessoa'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  formacaoAcad: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'INATIVO']),
  createUser: z.boolean().default(false),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
});

const updateProfessorSchema = professorSchema.partial().omit({ matricula: true, createUser: true, username: true, password: true });

type ProfessorFormData = z.infer<typeof professorSchema>;
type UpdateProfessorFormData = z.infer<typeof updateProfessorSchema>;

export default function ProfessoresPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [page, setPage] = useState(1);

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      situacao: 'ATIVO',
      dataInicio: new Date().toISOString().split('T')[0],
      createUser: false,
    }
  });

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    formState: { errors: errorsUpdate },
  } = useForm<UpdateProfessorFormData>({
    resolver: zodResolver(updateProfessorSchema),
  });

  const createUser = watch('createUser');

  // Fetch pessoas for the dropdown
  const {
    data: pessoas = [],
  } = useQuery({
    queryKey: ['pessoas'],
    queryFn: apiService.getPessoas,
  });

  // Fetch professores
  const {
    data: professoresResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['professores', page, searchTerm],
    queryFn: () => apiService.getProfessores({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'matricula',
      sortOrder: 'asc'
    }),
    retry: false,
  });

  const professores = professoresResponse?.data || [];
  const pagination = professoresResponse?.pagination;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (professor: CreateProfessorWithUser) => apiService.createProfessor(professor),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      toast({
        title: 'Professor cadastrado',
        description: result.user 
          ? `Professor e usuário criados com sucesso! Username: ${result.user.username}`
          : 'Professor cadastrado com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cadastrar professor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ matricula, data }: { matricula: string; data: Partial<CreateProfessorWithUser> }) =>
      apiService.updateProfessor(matricula, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      toast({
        title: 'Professor atualizado',
        description: 'Professor atualizado com sucesso!',
      });
      setShowForm(false);
      setEditingProfessor(null);
      resetUpdate();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar professor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (matricula: string) => apiService.deleteProfessor(matricula),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      toast({
        title: 'Professor removido',
        description: 'Professor removido com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover professor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter professores by search term
  const filteredProfessores = professores.filter((professor) =>
    professor.matricula.includes(searchTerm) ||
    (professor.pessoa?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (professor.pessoa?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.situacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (professor.formacaoAcad || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: ProfessorFormData | UpdateProfessorFormData) => {
    if (editingProfessor) {
      const { createUser, username, password, ...updateData } = data as ProfessorFormData;
      updateMutation.mutate({ matricula: editingProfessor.matricula, data: updateData });
    } else {
      createMutation.mutate(data as ProfessorFormData);
    }
  };

  // Handle edit
  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setShowForm(true);
    resetUpdate({
      pessoaId: professor.pessoaId,
      dataInicio: professor.dataInicio,
      formacaoAcad: professor.formacaoAcad || '',
      situacao: professor.situacao,
    });
  };

  // Handle delete
  const handleDelete = (matricula: string) => {
    if (window.confirm('Tem certeza que deseja remover este professor?')) {
      deleteMutation.mutate(matricula);
    }
  };

  // Handle new professor
  const handleNew = () => {
    setEditingProfessor(null);
    setShowForm(true);
    reset({
      situacao: 'ATIVO',
      dataInicio: new Date().toISOString().split('T')[0],
      createUser: false,
    });
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'INATIVO': return 'bg-red-100 text-red-800';
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
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Professores</h1>
                <p className="text-sm text-gray-600">Cadastro e gestão do corpo docente</p>
              </div>
            </div>
            {canEdit && (
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Professor
              </Button>
            )}
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
                Buscar Professores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Busque por matrícula, nome, email, situação ou formação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingProfessor ? 'Editar Professor' : 'Novo Professor'}
                </CardTitle>
                <CardDescription>
                  {editingProfessor 
                    ? 'Atualize os dados do professor'
                    : 'Complete o formulário para cadastrar um novo professor'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingProfessor ? handleSubmitUpdate(onSubmit) : handleSubmit(onSubmit)} className="space-y-6">
                  {/* Dados Básicos */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Básicos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {!editingProfessor && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Matrícula *
                          </label>
                          <Input
                            {...register('matricula')}
                            placeholder="Ex: PROF0001"
                            className={errors.matricula ? 'border-red-500' : ''}
                          />
                          {errors.matricula && (
                            <p className="mt-1 text-sm text-red-600">{errors.matricula.message}</p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pessoa *
                        </label>
                        <select
                          {...(editingProfessor ? registerUpdate('pessoaId') : register('pessoaId'))}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${(editingProfessor ? errorsUpdate.pessoaId : errors.pessoaId) ? 'border-red-500' : ''}`}
                        >
                          <option value="">Selecione uma pessoa...</option>
                          {pessoas.map((pessoa) => (
                            <option key={pessoa.id} value={pessoa.id}>
                              {pessoa.nome} {pessoa.email ? `(${pessoa.email})` : ''}
                            </option>
                          ))}
                        </select>
                        {(editingProfessor ? errorsUpdate.pessoaId : errors.pessoaId) && (
                          <p className="mt-1 text-sm text-red-600">{(editingProfessor ? errorsUpdate.pessoaId : errors.pessoaId)?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Início *
                        </label>
                        <Input
                          type="date"
                          {...(editingProfessor ? registerUpdate('dataInicio') : register('dataInicio'))}
                          className={(editingProfessor ? errorsUpdate.dataInicio : errors.dataInicio) ? 'border-red-500' : ''}
                        />
                        {(editingProfessor ? errorsUpdate.dataInicio : errors.dataInicio) && (
                          <p className="mt-1 text-sm text-red-600">{(editingProfessor ? errorsUpdate.dataInicio : errors.dataInicio)?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Situação *
                        </label>
                        <select
                          {...(editingProfessor ? registerUpdate('situacao') : register('situacao'))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="ATIVO">Ativo</option>
                          <option value="INATIVO">Inativo</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Formação Acadêmica
                        </label>
                        <Input
                          {...(editingProfessor ? registerUpdate('formacaoAcad') : register('formacaoAcad'))}
                          placeholder="Ex: Doutorado em Teologia, Mestrado em História Eclesiástica"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Criação de Usuário */}
                  {!editingProfessor && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Acesso ao Sistema</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('createUser')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Criar usuário de acesso para o professor
                          </label>
                        </div>

                        {createUser && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-blue-500 pl-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username *
                              </label>
                              <Input
                                {...register('username')}
                                placeholder="Ex: prof.maria"
                                className={errors.username ? 'border-red-500' : ''}
                              />
                              {errors.username && (
                                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                              )}
                            </div>

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
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingProfessor ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingProfessor(null);
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

          {/* Professores List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Professores Cadastrados ({filteredProfessores.length})
              </CardTitle>
              <CardDescription>
                Lista de todo o corpo docente cadastrado no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredProfessores.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProfessores.map((professor) => (
                    <Card key={professor.matricula} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {professor.pessoa?.nome || 'Nome não informado'}
                              </h3>
                              <p className="text-sm text-gray-500">Mat: {professor.matricula}</p>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(professor)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(professor.matricula)}
                                disabled={deleteMutation.isPending}
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Informações do Professor */}
                        <div className="space-y-3">
                          {/* Status */}
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSituacaoColor(professor.situacao)}`}>
                              {professor.situacao}
                            </span>
                          </div>

                          {/* Formação Acadêmica */}
                          {professor.formacaoAcad && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <GraduationCap className="h-4 w-4" />
                              <span className="truncate">{professor.formacaoAcad}</span>
                            </div>
                          )}

                          {/* Contato */}
                          {professor.pessoa?.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{professor.pessoa.email}</span>
                            </div>
                          )}

                          {professor.pessoa?.telefone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{professor.pessoa.telefone}</span>
                            </div>
                          )}

                          {/* Data de Início */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Início: {new Date(professor.dataInicio).toLocaleDateString('pt-BR')}</span>
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