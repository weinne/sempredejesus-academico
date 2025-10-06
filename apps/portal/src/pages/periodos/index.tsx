import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CrudHeader from '@/components/crud/crud-header';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import { apiService } from '@/services/api';
import { Curso, Periodo, Role, Turno, Curriculo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/auth-provider';
import { useCan } from '@/lib/permissions';
import {
  Layers3,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  BarChart3,
  Eye,
  Users,
  ListOrdered,
  Wand2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function PeriodosPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [cursoFiltro, setCursoFiltro] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [turnoFiltro, setTurnoFiltro] = useState<number | ''>('');
  const [curriculoFiltro, setCurriculoFiltro] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('card');
      } else {
        setViewMode('table');
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const canCreate = useCan('create', 'periodos');
  const canEdit = useCan('edit', 'periodos');
  const canDelete = useCan('delete', 'periodos');

  const { data: cursosResponse } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];
  const { data: turnos = [] } = useQuery({ queryKey: ['turnos'], queryFn: apiService.getTurnos });
  const { data: curriculos = [] } = useQuery({ queryKey: ['curriculos'], queryFn: () => apiService.getCurriculos() });

  const hasActiveCurso = cursoFiltro !== '';

  const curriculosDisponiveis = useMemo(() => {
    if (!hasActiveCurso) {
      return [] as Curriculo[];
    }
    return curriculos.filter((curriculo) => curriculo.cursoId === Number(cursoFiltro));
  }, [curriculos, hasActiveCurso, cursoFiltro]);

  const turnosDisponiveis = useMemo(() => {
    if (!hasActiveCurso) {
      return turnos;
    }
    const turnoIds = new Set(curriculosDisponiveis.map((curriculo) => curriculo.turnoId));
    return turnos.filter((turno) => turnoIds.has(turno.id));
  }, [hasActiveCurso, turnos, curriculosDisponiveis]);

  useEffect(() => {
    if (turnoFiltro !== '' && !turnosDisponiveis.some((turno) => turno.id === Number(turnoFiltro))) {
      setTurnoFiltro('');
    }
  }, [turnoFiltro, turnosDisponiveis]);

  useEffect(() => {
    if (curriculoFiltro !== '' && !curriculosDisponiveis.some((curriculo) => curriculo.id === Number(curriculoFiltro))) {
      setCurriculoFiltro('');
    }
  }, [curriculoFiltro, curriculosDisponiveis]);

  const {
    data: periodosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['periodos', page, searchTerm, cursoFiltro, turnoFiltro, curriculoFiltro],
    queryFn: () =>
      apiService.getPeriodos({
        page,
        limit: 20,
        search: searchTerm,
        cursoId: cursoFiltro ? Number(cursoFiltro) : undefined,
        ...(turnoFiltro ? { turnoId: Number(turnoFiltro) } : {}),
        ...(curriculoFiltro ? { curriculoId: Number(curriculoFiltro) } : {}),
      }),
    retry: false,
    enabled: hasActiveCurso,
  });

  const periodos = hasActiveCurso ? periodosResponse?.data || [] : [];
  const pagination = hasActiveCurso ? periodosResponse?.pagination : undefined;

  const { data: disciplinasResumo } = useQuery({
    queryKey: ['disciplinas', 'resumo-curso', cursoFiltro],
    queryFn: () => apiService.getDisciplinas({ cursoId: Number(cursoFiltro), limit: 1 }),
    enabled: hasActiveCurso,
    staleTime: 1000 * 60 * 5,
  });
  const totalDisciplinasCurso = disciplinasResumo?.pagination?.total ?? 0;
  const periodosTotal = hasActiveCurso ? (pagination?.total ?? periodos.length) : 0;
  const turnosConectados = hasActiveCurso ? turnosDisponiveis.length : 0;
  const selectedCourse = useMemo(() => {
    if (cursoFiltro === '') {
      return undefined;
    }
    const cursoId = Number(cursoFiltro);
    return cursos.find((curso) => curso.id === cursoId);
  }, [cursoFiltro, cursos]);
  const selectedTurno = useMemo(() => {
    if (turnoFiltro === '') {
      return undefined;
    }
    const turnoId = Number(turnoFiltro);
    return turnosDisponiveis.find((turno) => turno.id === turnoId) || turnos.find((turno) => turno.id === turnoId);
  }, [turnoFiltro, turnosDisponiveis, turnos]);
  const selectedCurriculo = useMemo(() => {
    if (curriculoFiltro === '') {
      return undefined;
    }
    const curriculoId = Number(curriculoFiltro);
    return curriculosDisponiveis.find((curriculo) => curriculo.id === curriculoId);
  }, [curriculoFiltro, curriculosDisponiveis]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deletePeriodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      toast({
        title: 'Período removido',
        description: 'Período removido com sucesso!',
      });
    },
    onError: (mutationError: any) => {
      // Verificar se é erro de restrição de FK
      if (mutationError.response?.status === 409 || 
          mutationError.message?.includes('foreign key') || 
          mutationError.message?.includes('constraint') ||
          mutationError.message?.includes('violates foreign key')) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este período possui disciplinas ou turmas relacionadas. Remova primeiro os dados relacionados para poder excluir o período.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Erro ao remover período',
        description: mutationError.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este perodo?')) {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title="Gestão de Períodos"
        description="Organize os períodos dos cursos"
        backTo="/cursos"
        actions={
          canCreate ? (
            <Button onClick={() => navigate('/periodos/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Período
            </Button>
          ) : undefined
        }
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-900/70 to-slate-900" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div className="max-w-2xl space-y-4">
              <Badge className="bg-white/20 text-white hover:bg-white/30">Gestão Acadêmica</Badge>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                Organização completa dos períodos acadêmicos
              </h1>
              <p className="text-base md:text-lg text-slate-200/80">
                Visualize e gerencie os períodos de cada curso com seus turnos, currículos e disciplinas.
                Configure a estrutura acadêmica de forma organizada e eficiente.
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
                  <p className="text-2xl font-semibold">{periodosTotal}</p>
                  <p className="text-xs text-slate-200/70">Períodos</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{turnosConectados}</p>
                  <p className="text-xs text-slate-200/70">Turnos</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalDisciplinasCurso}</p>
                  <p className="text-xs text-slate-200/70">Disciplinas</p>
                </div>
              </div>
              <Link
                to="/cursos"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-slate-100 hover:text-white transition"
              >
                Voltar aos cursos
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
                <h2 className="text-lg font-semibold text-slate-800">Escolha um curso para explorar os periodos</h2>
                <p className="text-sm text-slate-500">Os filtros de turno e curriculo serao habilitados apos selecionar o curso desejado.</p>
              </div>
              <div className="flex w-full md:w-auto items-center gap-2">
                <select
                  value={cursoFiltro ? String(cursoFiltro) : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCursoFiltro(value ? Number(value) : '');
                    setTurnoFiltro('');
                    setCurriculoFiltro('');
                    setSearchTerm('');
                    setPage(1);
                  }}
                  className="w-full md:w-64 rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Selecione um curso...</option>
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
          <CrudToolbar
            search={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            searchPlaceholder="Buscar por nome, numero ou descricao..."
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filtersSlot={
              <div className="flex gap-2 items-center">
                <select
                  value={turnoFiltro ? String(turnoFiltro) : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTurnoFiltro(value ? Number(value) : '');
                    setPage(1);
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                  disabled={!hasActiveCurso || turnosDisponiveis.length === 0}
                >
                  <option value="">{turnosDisponiveis.length ? 'Todos os turnos' : 'Selecione um curso'}</option>
                  {turnosDisponiveis.map((turno: Turno) => (
                    <option key={turno.id} value={turno.id}>{turno.nome}</option>
                  ))}
                </select>
                <select
                  value={curriculoFiltro ? String(curriculoFiltro) : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCurriculoFiltro(value ? Number(value) : '');
                    setPage(1);
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                  disabled={!hasActiveCurso || curriculosDisponiveis.length === 0}
                >
                  <option value="">{curriculosDisponiveis.length ? 'Todos os curriculos' : 'Selecione um curso'}</option>
                  {curriculosDisponiveis.map((curriculo: Curriculo) => (
                    <option key={curriculo.id} value={curriculo.id}>{curriculo.versao}</option>
                  ))}
                </select>
              </div>
            }
          />

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-slate-500">Curso ativo</span>
                <span className="text-lg font-semibold text-slate-900">{selectedCourse?.nome ?? 'Selecione um curso'}</span>
                <span className="text-sm text-slate-500">
                  {selectedCourse ? `Grau ${selectedCourse.grau}` : 'Os indicadores aparecem apos a selecao.'}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-slate-500">Curriculos associados</p>
                    <p className="text-2xl font-semibold text-slate-900">{curriculosDisponiveis.length}</p>
                  </div>
                  <Layers3 className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500">
                  Filtro: {selectedCurriculo ? `Versao ${selectedCurriculo.versao}` : 'Todos'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-slate-500">Turnos disponiveis</p>
                    <p className="text-2xl font-semibold text-slate-900">{turnosConectados}</p>
                  </div>
                  <Clock className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500">
                  Filtro: {selectedTurno ? selectedTurno.nome : 'Todos'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-slate-500">Periodos listados</p>
                    <p className="text-2xl font-semibold text-slate-900">{periodosTotal}</p>
                  </div>
                  <ListOrdered className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500">Disciplinas vinculadas: {totalDisciplinasCurso}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5" />
                Períodos Acadêmicos
              </CardTitle>
              <CardDescription>
                Acompanhe os perodos cadastrados e seu volume de disciplinas e alunos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={periodos}
                isLoading={isLoading}
                viewMode={viewMode}
                columns={[
                  {
                    key: 'numero',
                    header: 'Perodo',
                    render: (p: Periodo) => p.nome || `Perodo ${p.numero}`,
                  },
                  {
                    key: 'turno',
                    header: 'Turno',
                    render: (p: any) => {
                      const t = (turnos as any[]).find((x)=> x.id === (p.turnoId || p.turno?.id));
                      return t?.nome || p.turno?.nome || '';
                    },
                  },
                  {
                    key: 'curriculo',
                    header: 'Currculo',
                    render: (p: any) => {
                      const c = (curriculos as any[]).find((x)=> x.id === (p.curriculoId || p.curriculo?.id));
                      return c?.versao || '';
                    },
                  },
                  {
                    key: 'curso',
                    header: 'Curso',
                    render: (p: Periodo) => p.curso?.nome || cursos.find((c) => c.id === p.cursoId)?.nome || '',
                  },
                  {
                    key: 'totalDisciplinas',
                    header: 'Disciplinas',
                    render: (p: Periodo) => Number(p.totalDisciplinas ?? 0),
                  },
                  {
                    key: 'totalAlunos',
                    header: 'Alunos',
                    render: (p: Periodo) => Number(p.totalAlunos ?? 0),
                  },
                  {
                    key: 'actions',
                    header: 'Aes',
                    render: (p: Periodo) => (
                      <div className="flex items-center gap-1">
                        <Link to={`/periodos/view/${p.id}`} title="Visualizar">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canEdit && (
                          <>
                            <Link to={`/periodos/edit/${p.id}`} title="Editar">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(p.id)}
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
                cardRender={(periodo: Periodo) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Layers3 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {periodo.nome || `Perodo ${periodo.numero}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {periodo.curso?.nome || cursos.find((c) => c.id === periodo.cursoId)?.nome || 'Curso no informado'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Link to={`/periodos/view/${periodo.id}`} title="Visualizar">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {canEdit && (
                            <>
                              <Link to={`/periodos/edit/${periodo.id}`} title="Editar">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              {canDelete && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(periodo.id)}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4" />
                          <span>
                            {periodo.curso?.grau || cursos.find((c) => c.id === periodo.cursoId)?.grau || 'Grau no informado'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>{Number(periodo.totalDisciplinas ?? 0)} disciplinas</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{Number(periodo.totalAlunos ?? 0)} alunos</span>
                        </div>
                      </div>
                      {periodo.descricao && (
                        <p className="text-sm text-gray-600">{periodo.descricao}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
                emptyState={
                  <div className="text-center py-8 text-gray-500">
                    Nenhum perodo encontrado
                  </div>
                }
              />
              <Pagination
                page={pagination?.page || page}
                totalPages={pagination?.totalPages || 0}
                onChange={setPage}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}








