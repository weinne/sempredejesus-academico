import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Disciplina, Curso, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen,
  Clock,
  Award,
  FileText,
  Hash,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const disciplinaSchema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  codigo: z.string().min(1, 'Código é obrigatório').max(10),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  creditos: z.number().min(1).max(32767),
  cargaHoraria: z.number().min(1),
  ementa: z.string().optional(),
  bibliografia: z.string().optional(),
  ativo: z.boolean().default(true),
});

type DisciplinaFormData = z.infer<typeof disciplinaSchema>;

export default function DisciplinasPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
  const [page, setPage] = useState(1);

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DisciplinaFormData>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: {
      ativo: true,
    }
  });

  // Fetch cursos for the dropdown
  const {
    data: cursosResponse,
  } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 100 }),
  });

  const cursos = cursosResponse?.data || [];

  // Fetch disciplinas
  const {
    data: disciplinasResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['disciplinas', page, searchTerm],
    queryFn: () => apiService.getDisciplinas({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'nome',
      sortOrder: 'asc'
    }),
    retry: false,
  });

  const disciplinas = disciplinasResponse?.data || [];
  const pagination = disciplinasResponse?.pagination;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (disciplina: Omit<Disciplina, 'id'>) => apiService.createDisciplina(disciplina),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({
        title: 'Disciplina criada',
        description: 'Disciplina criada com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar disciplina',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Disciplina, 'id'>> }) =>
      apiService.updateDisciplina(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({
        title: 'Disciplina atualizada',
        description: 'Disciplina atualizada com sucesso!',
      });
      setShowForm(false);
      setEditingDisciplina(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar disciplina',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteDisciplina(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({
        title: 'Disciplina removida',
        description: 'Disciplina removida com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover disciplina',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter disciplinas by search term
  const filteredDisciplinas = disciplinas.filter((disciplina) =>
    disciplina.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (disciplina.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (disciplina.ementa || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: DisciplinaFormData) => {
    if (editingDisciplina) {
      updateMutation.mutate({ id: editingDisciplina.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (disciplina: Disciplina) => {
    setEditingDisciplina(disciplina);
    setShowForm(true);
    reset({
      cursoId: disciplina.cursoId,
      codigo: disciplina.codigo || '',
      nome: disciplina.nome,
      creditos: disciplina.creditos,
      cargaHoraria: disciplina.cargaHoraria,
      ementa: disciplina.ementa || '',
      bibliografia: disciplina.bibliografia || '',
      ativo: disciplina.ativo,
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta disciplina?')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle new disciplina
  const handleNew = () => {
    setEditingDisciplina(null);
    setShowForm(true);
    reset({
      ativo: true,
    });
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
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Disciplinas</h1>
                <p className="text-sm text-gray-600">Administração das disciplinas e planos de ensino</p>
              </div>
            </div>
            {canEdit && (
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Disciplina
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
                Buscar Disciplinas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Busque por nome, código ou ementa..."
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
                  {editingDisciplina ? 'Editar Disciplina' : 'Nova Disciplina'}
                </CardTitle>
                <CardDescription>
                  {editingDisciplina 
                    ? 'Atualize os dados da disciplina'
                    : 'Complete o formulário para criar uma nova disciplina'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Dados Básicos */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Curso *
                        </label>
                        <select
                          {...register('cursoId')}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.cursoId ? 'border-red-500' : ''}`}
                        >
                          <option value="">Selecione um curso...</option>
                          {cursos.map((curso) => (
                            <option key={curso.id} value={curso.id}>
                              {curso.nome} ({curso.grau})
                            </option>
                          ))}
                        </select>
                        {errors.cursoId && (
                          <p className="mt-1 text-sm text-red-600">{errors.cursoId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Código
                        </label>
                        <Input
                          {...register('codigo')}
                          placeholder="Ex: TEOL101"
                          className={errors.codigo ? 'border-red-500' : ''}
                        />
                        {errors.codigo && (
                          <p className="mt-1 text-sm text-red-600">{errors.codigo.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-1 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome da Disciplina *
                        </label>
                        <Input
                          {...register('nome')}
                          placeholder="Ex: Introdução à Teologia"
                          className={errors.nome ? 'border-red-500' : ''}
                        />
                        {errors.nome && (
                          <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Créditos *
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="32767"
                          {...register('creditos', { valueAsNumber: true })}
                          className={errors.creditos ? 'border-red-500' : ''}
                        />
                        {errors.creditos && (
                          <p className="mt-1 text-sm text-red-600">{errors.creditos.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Carga Horária *
                        </label>
                        <Input
                          type="number"
                          min="1"
                          {...register('cargaHoraria', { valueAsNumber: true })}
                          placeholder="Ex: 60"
                          className={errors.cargaHoraria ? 'border-red-500' : ''}
                        />
                        {errors.cargaHoraria && (
                          <p className="mt-1 text-sm text-red-600">{errors.cargaHoraria.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          {...register('ativo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="true">Ativa</option>
                          <option value="false">Inativa</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Plano de Ensino */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Plano de Ensino</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ementa
                        </label>
                        <Textarea
                          {...register('ementa')}
                          placeholder="Descreva os objetivos e conteúdo da disciplina..."
                          rows={4}
                          className={errors.ementa ? 'border-red-500' : ''}
                        />
                        {errors.ementa && (
                          <p className="mt-1 text-sm text-red-600">{errors.ementa.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bibliografia
                        </label>
                        <Textarea
                          {...register('bibliografia')}
                          placeholder="Liste os livros e materiais de referência..."
                          rows={4}
                          className={errors.bibliografia ? 'border-red-500' : ''}
                        />
                        {errors.bibliografia && (
                          <p className="mt-1 text-sm text-red-600">{errors.bibliografia.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingDisciplina ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingDisciplina(null);
                        reset();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Disciplinas List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Disciplinas Cadastradas ({filteredDisciplinas.length})
              </CardTitle>
              <CardDescription>
                Lista de todas as disciplinas e planos de ensino do seminário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredDisciplinas.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhuma disciplina encontrada' : 'Nenhuma disciplina cadastrada'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredDisciplinas.map((disciplina) => (
                    <Card key={disciplina.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${disciplina.ativo ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <BookOpen className={`h-5 w-5 ${disciplina.ativo ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                                {disciplina.nome}
                              </h3>
                              {disciplina.codigo && (
                                <p className="text-sm text-gray-500">{disciplina.codigo}</p>
                              )}
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(disciplina)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(disciplina.id)}
                                disabled={deleteMutation.isPending}
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Informações da Disciplina */}
                        <div className="space-y-3">
                          {/* Status e Informações Básicas */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {disciplina.ativo ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className={`text-sm font-medium ${disciplina.ativo ? 'text-green-600' : 'text-red-600'}`}>
                                {disciplina.ativo ? 'Ativa' : 'Inativa'}
                              </span>
                            </div>
                          </div>

                          {/* Detalhes Acadêmicos */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Award className="h-4 w-4" />
                              <span>{disciplina.creditos} créditos</span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{disciplina.cargaHoraria}h</span>
                            </div>
                          </div>

                          {/* Ementa */}
                          {disciplina.ementa && (
                            <div className="text-sm text-gray-600">
                              <div className="flex items-start space-x-2">
                                <FileText className="h-4 w-4 mt-0.5" />
                                <div>
                                  <p className="font-medium">Ementa:</p>
                                  <p className="line-clamp-3">{disciplina.ementa}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Bibliografia */}
                          {disciplina.bibliografia && (
                            <div className="text-sm text-gray-600">
                              <div className="flex items-start space-x-2">
                                <BookOpen className="h-4 w-4 mt-0.5" />
                                <div>
                                  <p className="font-medium">Bibliografia:</p>
                                  <p className="line-clamp-2">{disciplina.bibliografia}</p>
                                </div>
                              </div>
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