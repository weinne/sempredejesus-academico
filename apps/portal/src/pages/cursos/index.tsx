import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Curso, CreateCurso, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen,
  GraduationCap,
  Users,
  Clock,
  Award,
  Eye,
  BarChart3
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const cursoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(80),
  grau: z.string().max(30),
});

type CursoFormData = z.infer<typeof cursoSchema>;

export default function CursosPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [page, setPage] = useState(1);

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
  });

  // Fetch cursos
  const {
    data: cursosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cursos', page, searchTerm],
    queryFn: () => apiService.getCursos({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'nome',
      sortOrder: 'asc'
    }),
    retry: false,
  });

  const cursos = cursosResponse?.data || [];
  const pagination = cursosResponse?.pagination;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (curso: CreateCurso) => apiService.createCurso(curso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({
        title: 'Curso criado',
        description: 'Curso criado com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar curso',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCurso> }) =>
      apiService.updateCurso(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({
        title: 'Curso atualizado',
        description: 'Curso atualizado com sucesso!',
      });
      setShowForm(false);
      setEditingCurso(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar curso',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteCurso(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({
        title: 'Curso removido',
        description: 'Curso removido com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover curso',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter cursos by search term
  const filteredCursos = cursos.filter((curso) =>
    curso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curso.grau.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: CursoFormData) => {
    if (editingCurso) {
      updateMutation.mutate({ id: editingCurso.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setShowForm(true);
    reset({
      nome: curso.nome,
      grau: curso.grau,
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este curso? Esta ação pode afetar alunos e disciplinas vinculadas.')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle new curso
  const handleNew = () => {
    setEditingCurso(null);
    setShowForm(true);
    reset();
  };

  const getGrauColor = (grau: string) => {
    switch (grau.toUpperCase()) {
      case 'BACHARELADO': return 'bg-blue-100 text-blue-800';
      case 'LICENCIATURA': return 'bg-green-100 text-green-800';
      case 'ESPECIALIZACAO': return 'bg-purple-100 text-purple-800';
      case 'MESTRADO': return 'bg-orange-100 text-orange-800';
      case 'DOUTORADO': return 'bg-red-100 text-red-800';
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
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cursos</h1>
                <p className="text-sm text-gray-600">Administração dos cursos oferecidos pelo seminário</p>
              </div>
            </div>
            {canEdit && (
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Curso
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
                Buscar Cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Busque por nome ou grau do curso..."
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
                  {editingCurso ? 'Editar Curso' : 'Novo Curso'}
                </CardTitle>
                <CardDescription>
                  {editingCurso 
                    ? 'Atualize os dados do curso'
                    : 'Complete o formulário para criar um novo curso'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Curso *
                      </label>
                      <Input
                        {...register('nome')}
                        placeholder="Ex: Bacharelado em Teologia"
                        className={errors.nome ? 'border-red-500' : ''}
                      />
                      {errors.nome && (
                        <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grau Acadêmico *
                      </label>
                      <select
                        {...register('grau')}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.grau ? 'border-red-500' : ''}`}
                      >
                        <option value="">Selecione o grau...</option>
                        <option value="BACHARELADO">Bacharelado</option>
                        <option value="LICENCIATURA">Licenciatura</option>
                        <option value="ESPECIALIZACAO">Especialização</option>
                        <option value="MESTRADO">Mestrado</option>
                        <option value="DOUTORADO">Doutorado</option>
                      </select>
                      {errors.grau && (
                        <p className="mt-1 text-sm text-red-600">{errors.grau.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingCurso ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCurso(null);
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

          {/* Cursos List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Cursos Oferecidos ({filteredCursos.length})
              </CardTitle>
              <CardDescription>
                Lista de todos os cursos oferecidos pelo seminário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredCursos.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCursos.map((curso) => (
                    <Card key={curso.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                                {curso.nome}
                              </h3>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(curso)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(curso.id)}
                                disabled={deleteMutation.isPending}
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Informações do Curso */}
                        <div className="space-y-3">
                          {/* Grau */}
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGrauColor(curso.grau)}`}>
                              {curso.grau}
                            </span>
                          </div>

                          {/* Estatísticas */}
                          {curso.totalDisciplinas !== undefined && (
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center space-x-2 text-gray-600">
                                <BookOpen className="h-4 w-4" />
                                <span>{curso.totalDisciplinas} disciplinas</span>
                              </div>
                              
                              {curso.disciplinasAtivas !== undefined && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <Award className="h-4 w-4" />
                                  <span>{curso.disciplinasAtivas} ativas</span>
                                </div>
                              )}
                            </div>
                          )}

                          {curso.cargaHorariaTotal !== undefined && curso.cargaHorariaTotal > 0 && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{curso.cargaHorariaTotal}h de carga horária total</span>
                            </div>
                          )}

                          {/* Link para ver detalhes */}
                          <div className="pt-2 border-t border-gray-100">
                            <Link to={`/cursos/${curso.id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </Link>
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