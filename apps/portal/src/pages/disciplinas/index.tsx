import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Disciplina, Curso, Role, Periodo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import CrudHeader from '@/components/crud/crud-header';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
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
  XCircle,
  Layers3,
  Wand2,
  ArrowRight
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const disciplinaSchema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  periodoId: z.number().min(1, 'Selecione um perodo'),
  codigo: z.string().min(1, 'Cdigo  obrigatrio').max(10),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  creditos: z.number().min(1).max(32767),
  cargaHoraria: z.number().min(1),
  ementa: z.string().optional(),
  bibliografia: z.string().optional(),
  ativo: z.union([z.boolean(), z.string()]).transform(val => val === 'true' || val === true),
});

type DisciplinaFormData = z.infer<typeof disciplinaSchema>;

export default function DisciplinasPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
  const [page, setPage] = useState(1);
  const [activeCursoId, setActiveCursoId] = useState<number | ''>('');
  const [periodoFiltro, setPeriodoFiltro] = useState<number | ''>('');
  const [statusFiltro, setStatusFiltro] = useState<'all' | 'active' | 'inactive'>('all');

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DisciplinaFormData>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: {
      ativo: true,
    }
  });

  const selectedCursoId = watch('cursoId');
  const previousCursoIdRef = React.useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previousCursoIdRef.current === selectedCursoId) {
      return;
    }
    if (!selectedCursoId) {
      setValue('periodoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
    } else if (editingDisciplina && selectedCursoId === editingDisciplina.cursoId) {
      setValue('periodoId', editingDisciplina.periodoId, { shouldDirty: false, shouldValidate: false });
    } else {
      setValue('periodoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
    }
    previousCursoIdRef.current = selectedCursoId;
  }, [editingDisciplina, selectedCursoId, setValue]);

  useEffect(() => {
    if (!showForm) {
      return;
    }
    if (editingDisciplina) {
      setActiveCursoId(editingDisciplina.cursoId);
      setValue('cursoId', editingDisciplina.cursoId, { shouldDirty: false });
    } else if (activeCursoId) {
      setValue('cursoId', Number(activeCursoId), { shouldDirty: false });
    }
  }, [showForm, editingDisciplina, activeCursoId, setValue]);

  useEffect(() => {
    if (editingDisciplina) {
      setActiveCursoId(editingDisciplina.cursoId);
    }
  }, [editingDisciplina]);

  // Fetch cursos for the dropdown
  const {
    data: cursosResponse,
  } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 100 }),
  });

  const cursos = cursosResponse?.data || [];

  const { data: curriculosCurso } = useQuery({
    queryKey: ['curriculos', 'por-curso', activeCursoId],
    queryFn: () => apiService.getCurriculos({ cursoId: Number(activeCursoId), limit: 200 }),
    enabled: typeof activeCursoId === 'number',
    staleTime: 1000 * 60 * 5,
  });
  const curriculosDoCurso = curriculosCurso || [];

  const selectedCourse = useMemo(() => {
    if (typeof activeCursoId !== 'number') {
      return undefined;
    }
    return cursos.find((curso) => curso.id === activeCursoId);
  }, [activeCursoId, cursos]);

  const cursoIdParaListagens = selectedCursoId || (typeof activeCursoId === 'number' ? activeCursoId : undefined);

  const { data: periodosResponse } = useQuery({
    queryKey: ['periodos', cursoIdParaListagens],
    queryFn: () => apiService.getPeriodos({ cursoId: cursoIdParaListagens!, limit: 200 }),
    enabled: !!cursoIdParaListagens,
  });
  const periodos = periodosResponse?.data || [];

  useEffect(() => {
    setPeriodoFiltro('');
    setStatusFiltro('all');
    setSearchTerm('');
    setPage(1);
  }, [activeCursoId]);

  useEffect(() => {
    if (typeof periodoFiltro === 'number' && !periodos.some((periodo) => periodo.id === periodoFiltro)) {
      setPeriodoFiltro('');
    }
  }, [periodoFiltro, periodos]);

  // Fetch disciplinas
  const {
    data: disciplinasResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['disciplinas', page, searchTerm, activeCursoId, periodoFiltro],
    queryFn: () =>
      apiService.getDisciplinas({
        page,
        limit: 20,
        search: searchTerm,
        sortBy: 'nome',
        sortOrder: 'asc',
        cursoId: activeCursoId ? Number(activeCursoId) : undefined,
        periodoId: typeof periodoFiltro === 'number' ? periodoFiltro : undefined,
      }),
    retry: false,
    enabled: Boolean(activeCursoId),
  });

  const hasActiveCourse = Boolean(activeCursoId);

  const disciplinas = hasActiveCourse ? disciplinasResponse?.data || [] : [];
  const pagination = hasActiveCourse ? disciplinasResponse?.pagination : undefined;

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
  const searchValue = searchTerm.trim().toLowerCase();

  const filteredDisciplinas = hasActiveCourse
    ? disciplinas.filter((disciplina) => {
        const matchesSearch =
          !searchValue ||
          (disciplina.nome || '').toLowerCase().includes(searchValue) ||
          (disciplina.codigo || '').toLowerCase().includes(searchValue) ||
          (disciplina.ementa || '').toLowerCase().includes(searchValue) ||
          (disciplina.bibliografia || '').toLowerCase().includes(searchValue);
        if (!matchesSearch) {
          return false;
        }
        if (statusFiltro === 'active' && !disciplina.ativo) {
          return false;
        }
        if (statusFiltro === 'inactive' && disciplina.ativo) {
          return false;
        }
        if (typeof periodoFiltro === 'number' && disciplina.periodoId !== periodoFiltro) {
          return false;
        }
        return true;
      })
    : [];

  const totalPeriodosConfigurados = periodosResponse?.pagination?.total ?? periodos.length;
  const totalDisciplinasCatalogo = pagination?.total ?? filteredDisciplinas.length;
  const disciplinasVisiveis = filteredDisciplinas.length;
  const disciplinasAtivasNaPagina = filteredDisciplinas.filter((disciplina) => disciplina.ativo).length;
  const disciplinasInativasNaPagina = disciplinasVisiveis - disciplinasAtivasNaPagina;

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
      periodoId: disciplina.periodoId,
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
      periodoId: undefined as unknown as number,
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar dados</h2>
              <p className="text-gray-600">No foi possvel conectar com o servidor.</p>
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
        title="Gerenciar Disciplinas"
        description="Administração das disciplinas e planos de ensino"
        backTo="/dashboard"
        actions={canEdit ? (
          <div className="flex gap-2">
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Disciplina
            </Button>
            <Button variant="outline" onClick={() => navigate('/disciplinas/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Disciplina (Página)
            </Button>
          </div>
        ) : undefined}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-900/70 to-slate-900" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div className="max-w-2xl space-y-4">
              <Badge className="bg-white/20 text-white hover:bg-white/30">Catálogo Acadêmico</Badge>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                Gestão completa do catálogo de disciplinas
              </h1>
              <p className="text-base md:text-lg text-slate-200/80">
                Organize e gerencie todas as disciplinas dos cursos com seus períodos, 
                ementas, bibliografias e carga horária. Configure o plano de ensino de forma estruturada.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-md shadow-lg border border-white/10">
              <p className="text-sm uppercase tracking-wide text-slate-200/70">Visão geral</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold">{cursos.length}</p>
                  <p className="text-xs text-slate-200/70">Cursos</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalPeriodosConfigurados}</p>
                  <p className="text-xs text-slate-200/70">Períodos</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalDisciplinasCatalogo}</p>
                  <p className="text-xs text-slate-200/70">Disciplinas</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{disciplinasAtivasNaPagina}</p>
                  <p className="text-xs text-slate-200/70">Ativas</p>
                </div>
              </div>
              <Link
                to="/cursos"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-slate-100 hover:text-white transition"
              >
                Ver cursos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">Selecione um curso para gerenciar as disciplinas</h2>
                <p className="text-sm text-slate-500">As listagens e o formulario serao carregados de acordo com o curso escolhido.</p>
              </div>
              <div className="flex w-full md:w-auto items-center gap-2">
                <select
                  value={activeCursoId ? String(activeCursoId) : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setActiveCursoId(value ? Number(value) : '');
                    setPeriodoFiltro('');
                    setStatusFiltro('all');
                    setSearchTerm('');
                    setPage(1);
                  }}
                  className="w-full md:w-64 rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Escolha um curso...</option>
                  {cursos.map((curso: Curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nome}
                    </option>
                  ))}
                </select>
                {canEdit && (
                  <Button variant="outline" onClick={() => navigate('/cursos/wizard')} title="Abrir wizard de cursos">
                    <Wand2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {hasActiveCourse ? (
            <>
              <CrudToolbar
                search={searchTerm}
                onSearchChange={(value) => {
                  setSearchTerm(value);
                  setPage(1);
                }}
                searchPlaceholder="Busque por nome, codigo ou ementa..."
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filtersSlot={
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={periodoFiltro ? String(periodoFiltro) : ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        setPeriodoFiltro(value ? Number(value) : '');
                        setPage(1);
                      }}
                      className="px-3 py-2 border rounded-md text-sm"
                      disabled={!periodos.length}
                    >
                      <option value="">Todos os periodos</option>
                      {periodos.map((periodo: Periodo) => (
                        <option key={periodo.id} value={periodo.id}>
                          {periodo.nome || `Periodo ${periodo.numero}`}
                        </option>
                      ))}
                    </select>
                    <select
                      value={statusFiltro}
                      onChange={(event) => {
                        setStatusFiltro(event.target.value as 'all' | 'active' | 'inactive');
                        setPage(1);
                      }}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">Todos os status</option>
                      <option value="active">Ativas</option>
                      <option value="inactive">Inativas</option>
                    </select>
                  </div>
                }
              />

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase text-slate-500">Curso selecionado</span>
                    <span className="text-lg font-semibold text-slate-900">{selectedCourse?.nome ?? 'Curso nao encontrado'}</span>
                    <span className="text-sm text-slate-500">
                      {selectedCourse ? `Grau ${selectedCourse.grau}` : 'Escolha um curso para carregar os indicadores.'}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-slate-500">Curriculos</p>
                      <p className="text-2xl font-semibold text-slate-900">{curriculosDoCurso.length}</p>
                    </div>
                    <Layers3 className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-slate-500">Periodos configurados</p>
                      <p className="text-2xl font-semibold text-slate-900">{totalPeriodosConfigurados}</p>
                    </div>
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase text-slate-500">Disciplinas catalogo</p>
                        <p className="text-2xl font-semibold text-slate-900">{totalDisciplinasCatalogo}</p>
                      </div>
                      <BookOpen className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      <p>Pagina atual: {disciplinasVisiveis}</p>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          {disciplinasAtivasNaPagina} ativas
                        </span>
                        <span className="inline-flex items-center gap-1 text-rose-600">
                          <XCircle className="h-3 w-3" />
                          {disciplinasInativasNaPagina} inativas
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Disciplinas cadastradas ({filteredDisciplinas.length})
                  </CardTitle>
                  <CardDescription>
                    Lista de todas as disciplinas vinculadas ao curso selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataList
                    items={filteredDisciplinas}
                    viewMode={viewMode}
                    isLoading={isLoading}
                    columns={[
                      { key: 'nome', header: 'Nome' },
                      { key: 'codigo', header: 'Codigo' },
                      { key: 'creditos', header: 'Creditos' },
                      { key: 'cargaHoraria', header: 'Horas' },
                      {
                        key: 'periodo',
                        header: 'Periodo',
                        render: (d: any) =>
                          d.periodo ? (d.periodo.nome || `Periodo ${d.periodo.numero}`) : '',
                      },
                      {
                        key: 'ativo',
                        header: 'Status',
                        render: (d: any) => (
                          <span className={`text-sm font-medium ${d.ativo ? 'text-green-600' : 'text-red-600'}`}>{d.ativo ? 'Ativa' : 'Inativa'}</span>
                        ),
                      },
                      {
                        key: 'actions',
                        header: 'Acoes',
                        render: (d: any) => (
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(d)} title="Editar">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(d.id)}
                                  disabled={deleteMutation.isPending}
                                  title="Remover"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        ),
                      },
                    ]}
                    cardRender={(disciplina: any) => (
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${disciplina.ativo ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <BookOpen className={`h-5 w-5 ${disciplina.ativo ? 'text-green-600' : 'text-gray-400'}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900 leading-tight">{disciplina.nome}</h3>
                                {disciplina.codigo && (
                                  <p className="text-sm text-gray-500">{disciplina.codigo}</p>
                                )}
                              </div>
                            </div>
                            {canEdit && (
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(disciplina)} title="Editar">
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
                          <div className="space-y-3 text-sm text-gray-600">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2">
                                <Award className="h-4 w-4" />
                                <span>{disciplina.creditos} creditos</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>{disciplina.cargaHoraria}h</span>
                              </div>
                            </div>
                            {disciplina.periodo && (
                              <div className="flex items-center space-x-2">
                                <Layers3 className="h-4 w-4" />
                                <span>{disciplina.periodo.nome || `Periodo ${disciplina.periodo.numero}`}</span>
                              </div>
                            )}
                            {disciplina.ementa && (
                              <div className="flex items-start space-x-2">
                                <FileText className="h-4 w-4 mt-0.5" />
                                <div>
                                  <p className="font-medium">Ementa:</p>
                                  <p className="line-clamp-3">{disciplina.ementa}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    emptyState={(
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">{searchTerm ? 'Nenhuma disciplina encontrada' : 'Nenhuma disciplina cadastrada'}</p>
                      </div>
                    )}
                  />

                  <Pagination
                    page={page}
                    totalPages={pagination?.totalPages || 0}
                    onChange={setPage}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10 text-center space-y-3 text-slate-500">
                <Layers3 className="h-10 w-10 text-slate-300 mx-auto" />
                <p>Selecione um curso para visualizar e gerenciar as disciplinas correspondentes.</p>
              </CardContent>
            </Card>
          )}

          {/* Formulario Inline */}
          {showForm && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  {editingDisciplina ? 'Editar Disciplina' : 'Nova Disciplina'}
                </CardTitle>
                <CardDescription>
                  {editingDisciplina ? 'Atualize as informacoes da disciplina' : 'Preencha as informacoes da nova disciplina'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                    <select {...register('cursoId', { valueAsNumber: true })} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.cursoId ? 'border-red-500' : ''}`}>
                      <option value="">Selecione um curso...</option>
                      {cursos.map((curso: Curso) => (
                        <option key={curso.id} value={curso.id}>{curso.nome} ({curso.grau})</option>
                      ))}
                    </select>
                    {errors.cursoId && (<p className="mt-1 text-sm text-red-600">{errors.cursoId.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perodo *</label>
                    <select
                      {...register('periodoId', { valueAsNumber: true })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.periodoId ? 'border-red-500' : ''}`}
                      disabled={!selectedCursoId}
                    >
                      <option value="">{selectedCursoId ? 'Selecione um perodo...' : 'Selecione um curso primeiro'}</option>
                      {periodos.map((periodo: Periodo) => (
                        <option key={periodo.id} value={periodo.id}>
                          {periodo.nome || `Perodo ${periodo.numero}`}
                        </option>
                      ))}
                    </select>
                    {errors.periodoId && (<p className="mt-1 text-sm text-red-600">{errors.periodoId.message}</p>)}
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cdigo *</label>
                      <Input {...register('codigo')} placeholder="Ex: TSI001" />
                      {errors.codigo && (<p className="mt-1 text-sm text-red-600">{errors.codigo.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <Input {...register('nome')} placeholder="Nome da disciplina" />
                      {errors.nome && (<p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Crditos *</label>
                      <Input {...register('creditos', { valueAsNumber: true })} type="number" min="1" max="32767" />
                      {errors.creditos && (<p className="mt-1 text-sm text-red-600">{errors.creditos.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horria *</label>
                      <Input {...register('cargaHoraria', { valueAsNumber: true })} type="number" min="1" />
                      {errors.cargaHoraria && (<p className="mt-1 text-sm text-red-600">{errors.cargaHoraria.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select {...register('ativo')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        <option value="true">Ativa</option>
                        <option value="false">Inativa</option>
                      </select>
                      {errors.ativo && (<p className="mt-1 text-sm text-red-600">{errors.ativo.message}</p>)}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ementa</label>
                      <Textarea {...register('ementa')} placeholder="Descrio da disciplina..." rows={4} />
                      {errors.ementa && (<p className="mt-1 text-sm text-red-600">{errors.ementa.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bibliografia</label>
                      <Textarea {...register('bibliografia')} placeholder="Referncias bibliogrficas..." rows={4} />
                      {errors.bibliografia && (<p className="mt-1 text-sm text-red-600">{errors.bibliografia.message}</p>)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingDisciplina ? 'Atualizar' : 'Criar'} Disciplina
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowForm(false);
                      setEditingDisciplina(null);
                      reset();
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}



















