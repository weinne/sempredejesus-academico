import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
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
import { usePageHero } from '@/hooks/use-page-hero';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import { apiService } from '@/services/api';
import { Curso, Periodo, Turno, Curriculo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
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
  AlertTriangle,
} from 'lucide-react';

export default function PeriodosPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [cursoFiltro, setCursoFiltro] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [turnoFiltro, setTurnoFiltro] = useState<number | ''>('');
  const [curriculoFiltro, setCurriculoFiltro] = useState<number | ''>('');
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

  const canCreate = useCan('create', 'periodos');
  const canEdit = useCan('edit', 'periodos');
  const canDelete = useCan('delete', 'periodos');

  const [deletingPeriodo, setDeletingPeriodo] = useState<Periodo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: cursosResponse, isLoading: isLoadingCursos, error: cursosError } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
    retry: 2,
  });
  const cursos = cursosResponse?.data || [];
  const { data: turnos = [] } = useQuery({ 
    queryKey: ['turnos'], 
    queryFn: () => apiService.getTurnos(),
    retry: 2,
  });
  const { data: curriculos = [] } = useQuery({ 
    queryKey: ['curriculos'], 
    queryFn: () => apiService.getCurriculos(),
    retry: 2,
  });

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

  // Configure Hero via hook
  usePageHero({
    title: "Gestão de períodos acadêmicos",
    description: "Organize os períodos dos cursos com suas disciplinas e configurações acadêmicas.",
    backTo: "/cursos",
    stats: [
      { value: periodosTotal, label: 'Períodos' },
      { value: totalDisciplinasCurso, label: 'Disciplinas' },
      { value: turnosConectados, label: 'Turnos' },
      { value: cursos.length, label: 'Cursos' }
    ],
    actions: canCreate ? (
      <Button onClick={() => navigate('/periodos/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Período
      </Button>
    ) : undefined
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deletePeriodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      toast({
        title: 'Período removido',
        description: 'Período removido com sucesso!',
      });
      setIsDeleteDialogOpen(false);
      setDeletingPeriodo(null);
    },
    onError: (error) => {
      const apiError = error as { response?: { status?: number }; message?: string };
      // Verificar se é erro de restrição de FK
      if (
        apiError.response?.status === 409 ||
        apiError.message?.includes('foreign key') ||
        apiError.message?.includes('constraint') ||
        apiError.message?.includes('violates foreign key')
      ) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este período possui disciplinas ou turmas relacionadas. Remova primeiro os dados relacionados para poder excluir o período.',
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setDeletingPeriodo(null);
        return;
      }
      
      toast({
        title: 'Erro ao remover período',
        description: apiError.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      setDeletingPeriodo(null);
    },
  });

  const handleDelete = (periodo: Periodo) => {
    setDeletingPeriodo(periodo);
    setIsDeleteDialogOpen(true);
  };

  // Only show error if it's from the periodos query and we have an active curso
  // Don't block the UI if the error is from a disabled query
  if (error && hasActiveCurso) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar dados</h2>
              <p className="text-gray-600">Não foi possível conectar com o servidor.</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Recarregar página
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6 overflow-x-hidden">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1 min-w-0">
                <h2 className="text-lg font-semibold text-slate-800">Escolha um curso para explorar os periodos</h2>
                <p className="text-sm text-slate-500">Os filtros de turno e curriculo serao habilitados apos selecionar o curso desejado.</p>
              </div>
              <div className="flex w-full md:w-auto items-center gap-2 shrink-0">
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
                  disabled={isLoadingCursos}
                  className="w-full md:w-64 rounded-md border px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isLoadingCursos 
                      ? 'Carregando cursos...' 
                      : cursos.length === 0 
                        ? 'Nenhum curso disponível' 
                        : 'Selecione um curso...'}
                  </option>
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
              {cursosError && (
                <p className="text-sm text-red-600 mt-2">
                  Erro ao carregar cursos. Por favor, recarregue a página.
                </p>
              )}
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
            onViewModeChange={(mode) => {
              // Só permitir mudar manualmente em telas grandes (>= 1024px)
              if (window.innerWidth >= 1024) {
                setViewMode(mode);
              }
            }}
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
                  <option value="">{turnosDisponiveis.length ? 'Todos os turnos' : 'Selecione um curso para ver os turnos'}</option>
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
                  <option value="">{curriculosDisponiveis.length ? 'Todos os curriculos' : 'Selecione um curso para ver os curriculos'}</option>
                  {curriculosDisponiveis.map((curriculo: Curriculo) => (
                    <option key={curriculo.id} value={curriculo.id}>{curriculo.versao}</option>
                  ))}
                </select>
              </div>
            }
          />

          {hasActiveCurso && (
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
              <CardContent className="overflow-x-hidden">
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
                    render: (p: Periodo) => {
                      const turnoId = p.curriculo?.turnoId;
                      if (p.turno?.nome) {
                        return p.turno.nome;
                      }
                      if (turnoId) {
                        return turnos.find((turno) => turno.id === turnoId)?.nome || '';
                      }
                      return '';
                    },
                  },
                  {
                    key: 'curriculo',
                    header: 'Currculo',
                    render: (p: Periodo) => p.curriculo?.versao || curriculos.find((curriculo) => curriculo.id === p.curriculoId)?.versao || '',
                  },
                  {
                    key: 'curso',
                    header: 'Curso',
                    render: (p: Periodo) => {
                      if (p.curso?.nome) {
                        return p.curso.nome;
                      }
                      const cursoId = p.curriculo?.cursoId;
                      if (cursoId) {
                        const cursoEncontrado = cursos.find((c) => c.id === cursoId);
                        if (cursoEncontrado) {
                          return cursoEncontrado.nome;
                        }
                      }
                      return '';
                    },
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
                                onClick={() => handleDelete(p)}
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
                              {(() => {
                                if (periodo.curso?.nome) {
                                  return periodo.curso.nome;
                                }
                                const cursoId = periodo.curriculo?.cursoId;
                                if (cursoId) {
                                  const cursoEncontrado = cursos.find((c) => c.id === cursoId);
                                  if (cursoEncontrado) {
                                    return cursoEncontrado.nome;
                                  }
                                }
                                return 'Curso no informado';
                              })()}
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
                                  onClick={() => handleDelete(periodo)}
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
                            {(() => {
                              if (periodo.curso?.grau) {
                                return periodo.curso.grau;
                              }
                              const cursoId = periodo.curriculo?.cursoId;
                              if (cursoId) {
                                const cursoEncontrado = cursos.find((c) => c.id === cursoId);
                                if (cursoEncontrado?.grau) {
                                  return cursoEncontrado.grau;
                                }
                              }
                              return 'Grau no informado';
                            })()}
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
          )}
        </div>
      </main>

      {/* Dialog para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingPeriodo(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o período <strong>{deletingPeriodo?.nome || `Período ${deletingPeriodo?.numero}`}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingPeriodo(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPeriodo && deleteMutation.mutate(deletingPeriodo.id)}
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








