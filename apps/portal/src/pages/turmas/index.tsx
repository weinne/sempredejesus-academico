import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Turma, CreateTurma, Disciplina, Professor, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import CrudHeader from '@/components/crud/crud-header';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard, StatsGrid } from '@/components/ui/stats-card';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
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
  Award
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const turmaSchema = z.object({
  disciplinaId: z.number().min(1, 'Selecione uma disciplina'),
  professorId: z.string().min(1, 'Selecione um professor'),
  sala: z.string().max(20).optional(),
  horario: z.string().max(50).optional(),
  secao: z.string().max(6).optional(),
});

type TurmaFormData = z.infer<typeof turmaSchema>;

export default function TurmasPage() {
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [page, setPage] = useState(1);

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);
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

  // Restrict visibility for professor to only own turmas
  const professorFilteredTurmas = isProfessor
    ? turmas.filter((turma) => turma.professor?.pessoaId === user?.pessoaId)
    : turmas;

  // Filter by search term
  const filteredTurmas = professorFilteredTurmas.filter((turma) =>
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

  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'));
  useEffect(() => {
    const onResize = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title="Gerenciar Turmas"
        backTo="/dashboard"
        actions={canEdit ? (
          <Button onClick={() => navigate('/turmas/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        ) : undefined}
      />

      {/* Hero Section */}
      <HeroSection
        badge="Ofertas Acadêmicas"
        title="Gestão das turmas acadêmicas"
        description="Configure e gerencie as turmas oferecidas para organizar as ofertas acadêmicas."
        stats={[
          { value: turmas.length, label: 'Total de Turmas' },
          { value: disciplinas.length, label: 'Disciplinas' },
          { value: professores.length, label: 'Professores' },
          { value: turmas.reduce((acc, t) => acc + (t.totalInscritos || 0), 0), label: 'Total de Inscritos' }
        ]}
        actionLink={{
          href: '/disciplinas',
          label: 'Ver disciplinas'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Filtros */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">Filtros e Busca</h2>
                <p className="text-sm text-slate-500">Encontre turmas por disciplina, professor, sala ou horário</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Buscar</label>
                  <Input
                    placeholder="Busque por disciplina, professor, sala ou horário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-96"
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
          <StatsGrid>
            <StatCard
              title="Total de Turmas"
              value={turmas.length}
              icon={Calendar}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Disciplinas"
              value={disciplinas.length}
              icon={BookOpen}
              iconColor="text-green-600"
            />
            <StatCard
              title="Professores"
              value={professores.length}
              icon={User}
              iconColor="text-purple-600"
            />
            <StatCard
              title="Total de Inscritos"
              value={turmas.reduce((acc, t) => acc + (t.totalInscritos || 0), 0)}
              icon={Users}
              iconColor="text-orange-600"
            />
          </StatsGrid>

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
                  { key: 'professor', header: 'Professor', render: (t: any) => t?.professor?.pessoa?.nome || 'N/A' },
                  { key: 'periodo', header: 'Período (disciplina)', render: (t: any) => t?.disciplina?.periodo?.nome || t?.disciplina?.periodo?.numero || 'N/A' },
                  { key: 'coorte', header: 'Coorte', render: (t: any) => t?.coorte?.rotulo || '-' },
                  { key: 'sala', header: 'Sala', render: (t: any) => t?.sala || '-' },
                  { key: 'horario', header: 'Horário', render: (t: any) => t?.horario || '-' },
                  { key: 'inscritos', header: 'Inscritos', render: (t: any) => t?.totalInscritos || 0 },
                  { key: 'actions', header: 'Ações', render: (t: any) => (
                    <div className="flex items-center gap-1">
                      <Link to={`/turmas/view/${t.id}`} title="Visualizar">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)} disabled={deleteMutation.isPending} title="Remover">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                            <h3 className="font-semibold text-lg text-gray-900 leading-tight">{turma.disciplina?.codigo || 'N/A'}</h3>
                            <p className="text-sm text-gray-500">{turma.secao ? `Seção ${turma.secao}` : 'Turma'}</p>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-1">
                            <Link to={`/turmas/view/${turma.id}`}>
                              <Button variant="ghost" size="sm" title="Visualizar">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(turma)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(turma.id)} disabled={deleteMutation.isPending} title="Remover">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <BookOpen className="h-4 w-4" />
                          <span className="truncate">{turma.disciplina?.nome || 'Disciplina não informada'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="truncate">{turma.professor?.pessoa?.nome || 'Professor não informado'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Período: {turma.disciplina?.periodo?.nome || turma.disciplina?.periodo?.numero || 'N/A'}</span>
                        </div>
                        {turma.sala && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{turma.sala}</span>
                          </div>
                        )}
                        {turma.horario && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{turma.horario}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{turma.totalInscritos || 0} alunos inscritos</span>
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
    </div>
  );
}