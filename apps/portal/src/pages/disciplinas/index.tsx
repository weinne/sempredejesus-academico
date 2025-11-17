import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCan } from '@/lib/permissions';
import { apiService } from '@/services/api';
import { Disciplina, DisciplinaPeriodo, Curso, Periodo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { usePageHero } from '@/hooks/use-page-hero';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Clock,
  Award,
  FileText,
  Eye,
  Layers3,
  Wand2,
  ArrowRight
} from 'lucide-react';
export default function DisciplinasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [activeCursoId, setActiveCursoId] = useState<number | ''>('');
  const [periodoFiltro, setPeriodoFiltro] = useState<number | ''>('');
  const [statusFiltro, setStatusFiltro] = useState<'all' | 'active' | 'inactive'>('all');

  const canCreate = useCan('create', 'disciplinas');
  const canEdit = useCan('edit', 'disciplinas');
  const canDelete = useCan('delete', 'disciplinas');

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

  const cursoIdParaListagens = typeof activeCursoId === 'number' ? activeCursoId : undefined;

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
      // Verificar se é erro de restrição de FK
      if (error.response?.status === 409 || 
          error.message?.includes('foreign key') || 
          error.message?.includes('constraint') ||
          error.message?.includes('violates foreign key')) {
        toast({
          title: 'Não é possível excluir',
          description: 'Esta disciplina possui turmas ou avaliações relacionadas. Remova primeiro os dados relacionados para poder excluir a disciplina.',
          variant: 'destructive',
        });
        return;
      }
      
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
        if (typeof periodoFiltro === 'number') {
          const vinculos = Array.isArray(disciplina.periodos) ? disciplina.periodos : [];
          const possuiVinculo = vinculos.some((vinculo) => Number(vinculo.periodoId) === periodoFiltro);
          if (!possuiVinculo) {
            return false;
          }
        }
        return true;
      })
    : [];

  const totalPeriodosConfigurados = periodosResponse?.pagination?.total ?? periodos.length;
  const totalDisciplinasCatalogo = pagination?.total ?? filteredDisciplinas.length;
  const disciplinasVisiveis = filteredDisciplinas.length;
  const disciplinasAtivasNaPagina = filteredDisciplinas.filter((disciplina) => disciplina.ativo).length;
  const disciplinasInativasNaPagina = disciplinasVisiveis - disciplinasAtivasNaPagina;

  // Configure Hero via hook
  usePageHero({
    title: "Gestão completa do catálogo de disciplinas",
    description: "Organize e gerencie todas as disciplinas dos cursos com seus períodos, ementas, bibliografias e carga horária. Configure o plano de ensino de forma estruturada.",
    backTo: "/dashboard",
    stats: [
      { value: cursos.length, label: 'Cursos' },
      { value: totalPeriodosConfigurados, label: 'Períodos' },
      { value: totalDisciplinasCatalogo, label: 'Disciplinas' },
      { value: disciplinasAtivasNaPagina, label: 'Ativas' }
    ],
    actions: canCreate ? (
      <Button onClick={() => navigate('/disciplinas/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Disciplina
      </Button>
    ) : undefined
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta disciplina?')) {
      deleteMutation.mutate(id);
    }
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
                        render: (d: Disciplina) =>
                          d.periodos && d.periodos.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                          {d.periodos.map((vinculo: DisciplinaPeriodo) => (
                                <Badge key={`${d.id}-${vinculo.periodoId}`} variant="outline" className="text-xs">
                                  {vinculo.periodo?.nome || `Periodo ${vinculo.periodo?.numero ?? vinculo.periodoId}`}
                                  {vinculo.obrigatoria === false ? ' · Optativa' : ''}
                                  {vinculo.ordem ? ` · Ordem ${vinculo.ordem}` : ''}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Nenhum vínculo</span>
                          ),
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
                            <Link to={`/disciplinas/view/${d.id}`}>
                              <Button variant="ghost" size="sm" title="Visualizar">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canEdit && (
                              <>
                                <Link to={`/disciplinas/edit/${d.id}`}>
                                  <Button variant="ghost" size="sm" title="Editar">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                {canDelete && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(d.id)}
                                    disabled={deleteMutation.isPending}
                                    title="Remover"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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
                            <div className="flex space-x-1">
                              <Link to={`/disciplinas/view/${disciplina.id}`}>
                                <Button variant="ghost" size="sm" title="Visualizar">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {canEdit && (
                                <>
                                  <Link to={`/disciplinas/edit/${disciplina.id}`}>
                                    <Button variant="ghost" size="sm" title="Editar">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  {canDelete && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDelete(disciplina.id)}
                                      disabled={deleteMutation.isPending}
                                      title="Remover"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
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
                            {Array.isArray(disciplina.periodos) && disciplina.periodos.length > 0 && (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Layers3 className="h-4 w-4" />
                                  <span>Períodos vinculados</span>
                                </div>
                                <div className="flex flex-wrap gap-1 pl-6">
                                  {disciplina.periodos.map((vinculo: DisciplinaPeriodo) => (
                                    <Badge key={`${disciplina.id}-${vinculo.periodoId}-card`} variant="outline" className="text-xs">
                                      {vinculo.periodo?.nome || `Período ${vinculo.periodo?.numero ?? vinculo.periodoId}`}
                                      {vinculo.obrigatoria === false ? ' · Optativa' : ''}
                                      {vinculo.ordem ? ` · Ordem ${vinculo.ordem}` : ''}
                                    </Badge>
                                  ))}
                                </div>
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

        </div>
      </main>
    </div>
  );
}



















