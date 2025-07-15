import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Aluno, CreateAlunoWithUser, Pessoa, Curso, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  BookOpen,
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const alunoSchema = z.object({
  ra: z.string().length(8, 'RA deve ter 8 caracteres'),
  pessoaId: z.number().min(1, 'Selecione uma pessoa'),
  cursoId: z.number().min(1, 'Selecione um curso'),
  anoIngresso: z.number().min(1900).max(2100),
  igreja: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO']),
  coeficienteAcad: z.number().min(0).max(10).optional(),
  createUser: z.boolean().default(false),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
});

const updateAlunoSchema = alunoSchema.partial().omit({ ra: true, createUser: true, username: true, password: true });

type AlunoFormData = z.infer<typeof alunoSchema>;
type UpdateAlunoFormData = z.infer<typeof updateAlunoSchema>;

export default function AlunosPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
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
  } = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      situacao: 'ATIVO',
      anoIngresso: new Date().getFullYear(),
      createUser: false,
    }
  });

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    formState: { errors: errorsUpdate },
  } = useForm<UpdateAlunoFormData>({
    resolver: zodResolver(updateAlunoSchema),
  });

  const createUser = watch('createUser');

  // Fetch pessoas for the dropdown
  const {
    data: pessoas = [],
  } = useQuery({
    queryKey: ['pessoas'],
    queryFn: apiService.getPessoas,
  });

  // Fetch cursos for the dropdown
  const {
    data: cursosResponse,
  } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 100 }),
  });

  const cursos = cursosResponse?.data || [];

  // Fetch alunos
  const {
    data: alunosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['alunos', page, searchTerm],
    queryFn: () => apiService.getAlunos({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'ra',
      sortOrder: 'asc'
    }),
    retry: false,
  });

  const alunos = alunosResponse?.data || [];
  const pagination = alunosResponse?.pagination;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: apiService.createAluno,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast({
        title: 'Aluno criado',
        description: result.user 
          ? `Aluno e usuário criados com sucesso! Username: ${result.user.username}`
          : 'Aluno criado com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ ra, data }: { ra: string; data: Partial<CreateAlunoWithUser> }) =>
      apiService.updateAluno(ra, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast({
        title: 'Aluno atualizado',
        description: 'Aluno atualizado com sucesso!',
      });
      setShowForm(false);
      setEditingAluno(null);
      resetUpdate();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: apiService.deleteAluno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast({
        title: 'Aluno removido',
        description: 'Aluno removido com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter alunos by search term
  const filteredAlunos = alunos.filter((aluno) =>
    aluno.ra.includes(searchTerm) ||
    (aluno.pessoa?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aluno.pessoa?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.situacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aluno.curso?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: AlunoFormData) => {
    if (editingAluno) {
      const { createUser, username, password, ...updateData } = data;
      updateMutation.mutate({ ra: editingAluno.ra, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setShowForm(true);
    resetUpdate({
      pessoaId: aluno.pessoaId,
      cursoId: aluno.cursoId,
      anoIngresso: aluno.anoIngresso,
      igreja: aluno.igreja || '',
      situacao: aluno.situacao,
      coeficienteAcad: aluno.coeficienteAcad,
    });
  };

  // Handle delete
  const handleDelete = (ra: string) => {
    if (window.confirm('Tem certeza que deseja remover este aluno?')) {
      deleteMutation.mutate(ra);
    }
  };

  // Handle new aluno
  const handleNew = () => {
    setEditingAluno(null);
    setShowForm(true);
    reset({
      situacao: 'ATIVO',
      anoIngresso: new Date().getFullYear(),
      createUser: false,
    });
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'TRANCADO': return 'bg-yellow-100 text-yellow-800';
      case 'CONCLUIDO': return 'bg-blue-100 text-blue-800';
      case 'CANCELADO': return 'bg-red-100 text-red-800';
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
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Alunos</h1>
                <p className="text-sm text-gray-600">Matrícula e gestão acadêmica de estudantes</p>
              </div>
            </div>
            {canEdit && (
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Matrícula
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
                Buscar Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Busque por RA, nome, email, situação ou curso..."
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
                  {editingAluno ? 'Editar Aluno' : 'Nova Matrícula'}
                </CardTitle>
                <CardDescription>
                  {editingAluno 
                    ? 'Atualize os dados do aluno'
                    : 'Complete o formulário para matricular um novo aluno'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingAluno ? handleSubmitUpdate(onSubmit) : handleSubmit(onSubmit)} className="space-y-6">
                  {/* Dados Básicos */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Matrícula</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {!editingAluno && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            RA (Registro Acadêmico) *
                          </label>
                          <Input
                            {...register('ra')}
                            placeholder="Ex: 20241001"
                            className={errors.ra ? 'border-red-500' : ''}
                          />
                          {errors.ra && (
                            <p className="mt-1 text-sm text-red-600">{errors.ra.message}</p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pessoa *
                        </label>
                        <select
                          {...(editingAluno ? registerUpdate('pessoaId') : register('pessoaId'))}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${(editingAluno ? errorsUpdate.pessoaId : errors.pessoaId) ? 'border-red-500' : ''}`}
                        >
                          <option value="">Selecione uma pessoa...</option>
                          {pessoas.map((pessoa) => (
                            <option key={pessoa.id} value={pessoa.id}>
                              {pessoa.nome} {pessoa.email ? `(${pessoa.email})` : ''}
                            </option>
                          ))}
                        </select>
                        {(editingAluno ? errorsUpdate.pessoaId : errors.pessoaId) && (
                          <p className="mt-1 text-sm text-red-600">{(editingAluno ? errorsUpdate.pessoaId : errors.pessoaId)?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Curso *
                        </label>
                        <select
                          {...(editingAluno ? registerUpdate('cursoId') : register('cursoId'))}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${(editingAluno ? errorsUpdate.cursoId : errors.cursoId) ? 'border-red-500' : ''}`}
                        >
                          <option value="">Selecione um curso...</option>
                          {cursos.map((curso) => (
                            <option key={curso.id} value={curso.id}>
                              {curso.nome} ({curso.grau})
                            </option>
                          ))}
                        </select>
                        {(editingAluno ? errorsUpdate.cursoId : errors.cursoId) && (
                          <p className="mt-1 text-sm text-red-600">{(editingAluno ? errorsUpdate.cursoId : errors.cursoId)?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ano de Ingresso *
                        </label>
                        <Input
                          type="number"
                          min="1900"
                          max="2100"
                          {...(editingAluno ? registerUpdate('anoIngresso') : register('anoIngresso'))}
                          className={(editingAluno ? errorsUpdate.anoIngresso : errors.anoIngresso) ? 'border-red-500' : ''}
                        />
                        {(editingAluno ? errorsUpdate.anoIngresso : errors.anoIngresso) && (
                          <p className="mt-1 text-sm text-red-600">{(editingAluno ? errorsUpdate.anoIngresso : errors.anoIngresso)?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Situação *
                        </label>
                        <select
                          {...(editingAluno ? registerUpdate('situacao') : register('situacao'))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="ATIVO">Ativo</option>
                          <option value="TRANCADO">Trancado</option>
                          <option value="CONCLUIDO">Concluído</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Coeficiente Acadêmico
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          {...(editingAluno ? registerUpdate('coeficienteAcad') : register('coeficienteAcad'))}
                          placeholder="Ex: 8.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados Complementares */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Complementares</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Igreja de Origem
                        </label>
                        <Input
                          {...(editingAluno ? registerUpdate('igreja') : register('igreja'))}
                          placeholder="Nome da igreja"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Criação de Usuário */}
                  {!editingAluno && (
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
                            Criar usuário de acesso para o aluno
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
                                placeholder="Ex: joao.silva"
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
                      {editingAluno ? 'Atualizar' : 'Matricular'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingAluno(null);
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

          {/* Alunos List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Alunos Matriculados ({filteredAlunos.length})
              </CardTitle>
              <CardDescription>
                Lista de todos os alunos matriculados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredAlunos.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno matriculado'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAlunos.map((aluno) => (
                    <Card key={aluno.ra} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <GraduationCap className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {aluno.pessoa?.nome || 'Nome não informado'}
                              </h3>
                              <p className="text-sm text-gray-500">RA: {aluno.ra}</p>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Link to={`/alunos/${aluno.ra}`}>
                                <Button variant="ghost" size="sm" title="Visualizar">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(aluno)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(aluno.ra)}
                                disabled={deleteMutation.isPending}
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Informações do Aluno */}
                        <div className="space-y-3">
                          {/* Status e Curso */}
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSituacaoColor(aluno.situacao)}`}>
                              {aluno.situacao}
                            </span>
                            {aluno.coeficienteAcad && (
                              <div className="flex items-center space-x-1">
                                <Award className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  {aluno.coeficienteAcad.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Curso */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <BookOpen className="h-4 w-4" />
                            <span className="truncate">
                              {aluno.curso?.nome || 'Curso não informado'}
                            </span>
                          </div>

                          {/* Contato */}
                          {aluno.pessoa?.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{aluno.pessoa.email}</span>
                            </div>
                          )}

                          {aluno.pessoa?.telefone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{aluno.pessoa.telefone}</span>
                            </div>
                          )}

                          {/* Ano de Ingresso */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Ingresso: {aluno.anoIngresso}</span>
                          </div>

                          {/* Igreja */}
                          {aluno.igreja && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{aluno.igreja}</span>
                            </div>
                          )}
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