import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Turma, CreateTurma, Disciplina, Professor, Semestre, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  BookOpen,
  User,
  Clock,
  MapPin,
  Users,
  Eye
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const turmaSchema = z.object({
  disciplinaId: z.number().min(1, 'Selecione uma disciplina'),
  professorId: z.string().min(1, 'Selecione um professor'),
  semestreId: z.number().min(1, 'Selecione um semestre'),
  sala: z.string().max(20).optional(),
  horario: z.string().max(50).optional(),
  secao: z.string().max(6).optional(),
});

type TurmaFormData = z.infer<typeof turmaSchema>;

export default function TurmasPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [page, setPage] = useState(1);

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TurmaFormData>({
    resolver: zodResolver(turmaSchema),
  });

  // Fetch disciplinas for the dropdown
  const {
    data: disciplinasResponse,
  } = useQuery({
    queryKey: ['disciplinas'],
    queryFn: () => apiService.getDisciplinas({ limit: 100 }),
  });

  const disciplinas = disciplinasResponse?.data || [];

  // Fetch professores for the dropdown
  const {
    data: professoresResponse,
  } = useQuery({
    queryKey: ['professores'],
    queryFn: () => apiService.getProfessores({ limit: 100 }),
  });

  const professores = professoresResponse?.data || [];

  // Fetch semestres for the dropdown
  const {
    data: semestres = [],
  } = useQuery({
    queryKey: ['semestres'],
    queryFn: apiService.getSemestres,
  });

  // Fetch turmas
  const {
    data: turmasResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['turmas', page, searchTerm],
    queryFn: () => apiService.getTurmas({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'id',
      sortOrder: 'desc'
    }),
    retry: false,
  });

  const turmas = turmasResponse?.data || [];
  const pagination = turmasResponse?.pagination;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (turma: CreateTurma) => apiService.createTurma(turma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast({
        title: 'Turma criada',
        description: 'Turma criada com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar turma',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTurma> }) =>
      apiService.updateTurma(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast({
        title: 'Turma atualizada',
        description: 'Turma atualizada com sucesso!',
      });
      setShowForm(false);
      setEditingTurma(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar turma',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteTurma(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast({
        title: 'Turma removida',
        description: 'Turma removida com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover turma',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter turmas by search term
  const filteredTurmas = turmas.filter((turma) =>
    (turma.disciplina?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (turma.disciplina?.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (turma.professor?.pessoa?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (turma.sala || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (turma.horario || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: TurmaFormData) => {
    if (editingTurma) {
      updateMutation.mutate({ id: editingTurma.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setShowForm(true);
    reset({
      disciplinaId: turma.disciplinaId,
      professorId: turma.professorId,
      semestreId: turma.semestreId,
      sala: turma.sala || '',
      horario: turma.horario || '',
      secao: turma.secao || '',
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta turma? Esta ação pode afetar alunos matriculados.')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle new turma
  const handleNew = () => {
    setEditingTurma(null);
    setShowForm(true);
    reset();
  };

  const getSemestreLabel = (semestre: Semestre) => {
    return `${semestre.ano}.${semestre.periodo}`;
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
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Turmas</h1>
                <p className="text-sm text-gray-600">Gestão de turmas e disciplinas por semestre</p>
              </div>
            </div>
            {canEdit && (
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
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
                Buscar Turmas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Busque por disciplina, professor, sala ou horário..."
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
                  {editingTurma ? 'Editar Turma' : 'Nova Turma'}
                </CardTitle>
                <CardDescription>
                  {editingTurma 
                    ? 'Atualize os dados da turma'
                    : 'Complete o formulário para criar uma nova turma'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Dados Básicos */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Turma</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Disciplina *
                        </label>
                        <select
                          {...register('disciplinaId', { valueAsNumber: true })}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.disciplinaId ? 'border-red-500' : ''}`}
                        >
                          <option value="">Selecione uma disciplina...</option>
                          {disciplinas.map((disciplina) => (
                            <option key={disciplina.id} value={disciplina.id}>
                              {disciplina.codigo} - {disciplina.nome}
                            </option>
                          ))}
                        </select>
                        {errors.disciplinaId && (
                          <p className="mt-1 text-sm text-red-600">{errors.disciplinaId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Professor *
                        </label>
                        <select
                          {...register('professorId')}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.professorId ? 'border-red-500' : ''}`}
                        >
                          <option value="">Selecione um professor...</option>
                          {professores.map((professor) => (
                            <option key={professor.matricula} value={professor.matricula}>
                              {professor.pessoa?.nome || 'Nome não informado'}
                            </option>
                          ))}
                        </select>
                        {errors.professorId && (
                          <p className="mt-1 text-sm text-red-600">{errors.professorId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Semestre *
                        </label>
                        <select
                          {...register('semestreId', { valueAsNumber: true })}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.semestreId ? 'border-red-500' : ''}`}
                        >
                          <option value="">Selecione um semestre...</option>
                          {semestres.map((semestre) => (
                            <option key={semestre.id} value={semestre.id}>
                              {getSemestreLabel(semestre)} {semestre.ativo ? '(Ativo)' : ''}
                            </option>
                          ))}
                        </select>
                        {errors.semestreId && (
                          <p className="mt-1 text-sm text-red-600">{errors.semestreId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sala
                        </label>
                        <Input
                          {...register('sala')}
                          placeholder="Ex: Sala 101, Lab A"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Horário
                        </label>
                        <Input
                          {...register('horario')}
                          placeholder="Ex: Seg 08:00-10:00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seção
                        </label>
                        <Input
                          {...register('secao')}
                          placeholder="Ex: A, B, C"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingTurma ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingTurma(null);
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

          {/* Turmas List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Turmas ({filteredTurmas.length})
              </CardTitle>
              <CardDescription>
                Lista de todas as turmas cadastradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredTurmas.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhuma turma encontrada' : 'Nenhuma turma cadastrada'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTurmas.map((turma) => (
                    <Card key={turma.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-full">
                              <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                                {turma.disciplina?.codigo || 'N/A'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {turma.secao ? `Seção ${turma.secao}` : 'Turma'}
                              </p>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Link to={`/turmas/${turma.id}`}>
                                <Button variant="ghost" size="sm" title="Visualizar">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(turma)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(turma.id)}
                                disabled={deleteMutation.isPending}
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Informações da Turma */}
                        <div className="space-y-3">
                          {/* Disciplina */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <BookOpen className="h-4 w-4" />
                            <span className="truncate">
                              {turma.disciplina?.nome || 'Disciplina não informada'}
                            </span>
                          </div>

                          {/* Professor */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="truncate">
                              {turma.professor?.pessoa?.nome || 'Professor não informado'}
                            </span>
                          </div>

                          {/* Semestre */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Semestre: {turma.semestre ? getSemestreLabel(turma.semestre) : 'N/A'}
                            </span>
                          </div>

                          {/* Sala */}
                          {turma.sala && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{turma.sala}</span>
                            </div>
                          )}

                          {/* Horário */}
                          {turma.horario && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{turma.horario}</span>
                            </div>
                          )}

                          {/* Inscritos */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{turma.totalInscritos || 0} alunos inscritos</span>
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