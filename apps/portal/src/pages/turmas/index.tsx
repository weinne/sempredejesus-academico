import React, { useEffect, useState } from 'react';
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
import { useCan } from '@/lib/permissions';
import { usePageHero } from '@/hooks/use-page-hero';
import { apiService } from '@/services/api';
import { Turma, CreateTurma, Disciplina, DisciplinaPeriodo, Professor, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import CrudToolbar from '@/components/crud/crud-toolbar';
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
  Eye,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  Award,
  AlertTriangle
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const turmaSchema = z.object({
  disciplinaId: z.number().min(1, 'Selecione uma disciplina'),
  professorId: z.string().min(1, 'Selecione um professor'),
  sala: z.string().max(20).optional(),
  secao: z.string().max(6).optional(),
});

type TurmaFormData = z.infer<typeof turmaSchema>;

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function TurmasPage() {
  const formatHorario = (t: any) => {
    if (t.diaSemana === null || t.diaSemana === undefined) return '-';
    const dia = DIAS_SEMANA[Number(t.diaSemana)];
    const horario = t.horarioInicio && t.horarioFim 
      ? `${t.horarioInicio.slice(0, 5)} - ${t.horarioFim.slice(0, 5)}`
      : '';
    return `${dia} ${horario}`.trim();
  };

  const getDisciplinaPeriodoLabel = (disciplina?: Disciplina) => {
    if (!disciplina || !Array.isArray(disciplina.periodos) || disciplina.periodos.length === 0) {
      return 'N/A';
    }
    const vinculo = disciplina.periodos[0];
    const periodo = vinculo.periodo;
    if (periodo) {
      return periodo.nome || (periodo.numero !== undefined ? `Período ${periodo.numero}` : `Período ${vinculo.periodoId}`);
    }
    return `Período ${vinculo.periodoId}`;
  };
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [page, setPage] = useState(1);
  const [deletingTurma, setDeletingTurma] = useState<Turma | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canCreate = useCan('create', 'turmas');
  const canEdit = useCan('edit', 'turmas');
  const canDelete = useCan('delete', 'turmas');
  const isProfessor = hasRole(Role.PROFESSOR);

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

  // Semestres removidos

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

  // Configure Hero via hook
  usePageHero({
    title: "Gestão das turmas acadêmicas",
    description: "Configure e gerencie as turmas oferecidas para organizar as ofertas acadêmicas.",
    backTo: "/dashboard",
    stats: [
      { value: pagination?.total || 0, label: 'Total de Turmas' },
      { value: disciplinas.length, label: 'Disciplinas' },
      { value: professores.length, label: 'Professores' },
      { value: turmas.reduce((acc, t) => acc + (t.totalInscritos || 0), 0), label: 'Total de Inscritos' }
    ],
    actionLink: {
      href: '/disciplinas',
      label: 'Ver disciplinas'
    },
    actions: canCreate ? (
      <Button onClick={() => navigate('/turmas/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Turma
      </Button>
    ) : undefined
  });

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
      setIsDeleteDialogOpen(false);
      setDeletingTurma(null);
    },
    onError: (error: any) => {
      // Verificar se é erro de restrição de FK
      if (error.response?.status === 409 || 
          error.message?.includes('foreign key') || 
          error.message?.includes('constraint') ||
          error.message?.includes('violates foreign key')) {
        toast({
          title: 'Não é possível excluir',
          description: 'Esta turma possui inscrições de alunos, aulas ou avaliações relacionadas. Remova primeiro os dados relacionados para poder excluir a turma.',
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setDeletingTurma(null);
        return;
      }
      
      toast({
        title: 'Erro ao remover turma',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      setDeletingTurma(null);
    },
  });

  // Restrict visibility for professor to only own turmas
  const professorFilteredTurmas = isProfessor
    ? turmas.filter((turma) => turma.professor?.pessoaId === user?.pessoaId)
    : turmas;

  // Filter by search term
  const filteredTurmas = professorFilteredTurmas.filter((turma) =>
    (turma.disciplina?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (turma.disciplina?.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (turma.professor?.pessoa?.nomeCompleto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (turma.sala || '').toLowerCase().includes(searchTerm.toLowerCase())
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
    navigate(`/turmas/edit/${turma.id}`);
  };

  // Handle delete
  const handleDelete = (turma: Turma) => {
    setDeletingTurma(turma);
    setIsDeleteDialogOpen(true);
  };

  // Handle new turma
  const handleNew = () => {
    setEditingTurma(null);
    setShowForm(true);
    reset();
  };

  // Semestre removido

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

  // Automaticamente usar cards em telas menores para evitar barra de rolagem lateral
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'card' : 'table'
  );

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

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          <CrudToolbar
            search={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            searchPlaceholder="Busque por disciplina, professor, sala ou horário..."
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              // Só permitir mudar manualmente em telas grandes (>= 1024px)
              if (window.innerWidth >= 1024) {
                setViewMode(mode);
              }
            }}
            filtersSlot={
              <div className="flex flex-wrap gap-2 items-center">
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setPage(1);
                    }}
                    className="h-9 text-xs sm:text-sm"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            }
          />

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
              <DataList
                items={filteredTurmas}
                viewMode={viewMode}
                isLoading={isLoading}
                columns={[
                  { key: 'disciplina', header: 'Disciplina', render: (t: any) => t?.disciplina?.nome || 'N/A' },
                  { key: 'professor', header: 'Professor', render: (t: any) => t?.professor?.pessoa?.nomeCompleto || 'N/A' },
                  {
                    key: 'periodo',
                    header: 'Período (disciplina)',
                    render: (t: Turma) => {
                      const disciplinaRelacionada = t.disciplina;
                      const periodos = disciplinaRelacionada?.periodos;
                      if (!Array.isArray(periodos) || periodos.length === 0) {
                        return 'Nenhum vínculo';
                      }
                      return periodos
                        .map((vinculo: DisciplinaPeriodo) => {
                          const periodo = vinculo.periodo;
                          if (periodo) {
                            return periodo.nome || (periodo.numero !== undefined ? `Período ${periodo.numero}` : `Período ${vinculo.periodoId}`);
                          }
                          return `Período ${vinculo.periodoId}`;
                        })
                        .join(', ');
                    },
                  },
                  { key: 'coorte', header: 'Coorte', render: (t: any) => t?.coorte?.rotulo || '-' },
                  { key: 'sala', header: 'Sala', render: (t: any) => t?.sala || '-' },
                  { key: 'horario', header: 'Horário', render: (t: any) => formatHorario(t) },
                  { key: 'inscritos', header: 'Inscritos', render: (t: any) => t?.totalInscritos || 0 },
                  { key: 'actions', header: 'Ações', render: (t: any) => (
                    <div className="flex items-center gap-1">
                      <Link to={`/turmas/view/${t.id}`} title="Visualizar">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Link to={`/turmas/inscricoes/${t.id}`} title="Gerenciar alunos">
                        <Button variant="ghost" size="sm"><Users className="h-4 w-4" /></Button>
                      </Link>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(t)} disabled={deleteMutation.isPending} title="Remover">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ) },
                ]}
                cardRender={(turma: any) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <Calendar className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                              {turma.disciplina?.nome || 'Disciplina não informada'}
                            </h3>
                            {turma.disciplina?.codigo && (
                              <p className="text-sm text-gray-500">{turma.disciplina.codigo}</p>
                            )}
                            {turma.secao && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Seção {turma.secao}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Link to={`/turmas/view/${turma.id}`}>
                            <Button variant="ghost" size="sm" title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/turmas/inscricoes/${turma.id}`}>
                            <Button variant="ghost" size="sm" title="Gerenciar alunos">
                              <Users className="h-4 w-4" />
                            </Button>
                          </Link>
                          {canEdit && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(turma)} title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(turma.id)} disabled={deleteMutation.isPending} title="Remover">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="grid grid-cols-2 gap-3">
                          {turma.professor?.pessoa?.nomeCompleto && (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span className="truncate">{turma.professor.pessoa.nomeCompleto}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{getDisciplinaPeriodoLabel(turma.disciplina)}</span>
                          </div>
                          {turma.sala && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{turma.sala}</span>
                            </div>
                          )}
                          {(turma.diaSemana !== undefined || turma.horarioInicio) && (
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatHorario(turma)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {turma.totalInscritos || 0} alunos
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                emptyState={
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{searchTerm ? 'Nenhuma turma encontrada' : 'Nenhuma turma cadastrada'}</p>
                  </div>
                }
              />

              <Pagination page={page} totalPages={pagination?.totalPages || 0} onChange={setPage} />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingTurma(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a turma <strong>{deletingTurma?.disciplina?.nome || deletingTurma?.disciplina?.codigo || 'esta turma'}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
              <br />
              <br />
              <span className="text-sm text-gray-600">
                Esta ação pode afetar alunos matriculados.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingTurma(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTurma && deleteMutation.mutate(deletingTurma.id)}
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