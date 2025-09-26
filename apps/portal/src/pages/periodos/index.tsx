import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CrudHeader from '@/components/crud/crud-header';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import { apiService } from '@/services/api';
import { Curso, Periodo, Role, Turno, Curriculo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/auth-provider';
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

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  const { data: cursosResponse } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];
  const { data: turnos = [] } = useQuery({ queryKey: ['turnos'], queryFn: apiService.getTurnos });
  const { data: curriculos = [] } = useQuery({ queryKey: ['curriculos'], queryFn: () => apiService.getCurriculos() });

  const {
    data: periodosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['periodos', page, searchTerm, cursoFiltro, turnoFiltro, curriculoFiltro],
    queryFn: () => apiService.getPeriodos({
      page,
      limit: 20,
      search: searchTerm,
      cursoId: cursoFiltro ? Number(cursoFiltro) : undefined,
      ...(turnoFiltro ? { turnoId: Number(turnoFiltro) } as any : {}),
      ...(curriculoFiltro ? { curriculoId: Number(curriculoFiltro) } as any : {}),
    }),
    retry: false,
  });

  const periodos = periodosResponse?.data || [];
  const pagination = periodosResponse?.pagination;

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
      toast({
        title: 'Erro ao remover período',
        description: mutationError.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este período?')) {
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
              <p className="text-gray-600">Não foi possível conectar com o servidor.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title="Gestão de Períodos"
        description="Organize os períodos dos cursos"
        backTo="/cursos"
        actions={
          canEdit ? (
            <Button onClick={() => navigate('/periodos/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Período
            </Button>
          ) : undefined
        }
      />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <CrudToolbar
            search={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            searchPlaceholder="Buscar por nome, número ou curso..."
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filtersSlot={
              <div className="flex gap-2 items-center">
                <select
                  value={cursoFiltro ? String(cursoFiltro) : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCursoFiltro(value ? Number(value) : '');
                    setPage(1);
                  }}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">Todos os cursos</option>
                  {cursos.map((curso: Curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nome}
                    </option>
                  ))}
                </select>
                <select
                  value={turnoFiltro ? String(turnoFiltro) : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTurnoFiltro(value ? Number(value) : '');
                    setPage(1);
                  }}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">Todos os turnos</option>
                  {turnos.map((t: Turno) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
                <select
                  value={curriculoFiltro ? String(curriculoFiltro) : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCurriculoFiltro(value ? Number(value) : '');
                    setPage(1);
                  }}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">Todos os currículos</option>
                  {curriculos.map((c: Curriculo) => (
                    <option key={c.id} value={c.id}>{c.versao}</option>
                  ))}
                </select>
              </div>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5" />
                Períodos Acadêmicos
              </CardTitle>
              <CardDescription>
                Acompanhe os períodos cadastrados e seu volume de disciplinas e alunos
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
                    header: 'Período',
                    render: (p: Periodo) => p.nome || `Período ${p.numero}`,
                  },
                  {
                    key: 'turno',
                    header: 'Turno',
                    render: (p: any) => {
                      const t = (turnos as any[]).find((x)=> x.id === (p.turnoId || p.turno?.id));
                      return t?.nome || p.turno?.nome || '—';
                    },
                  },
                  {
                    key: 'curriculo',
                    header: 'Currículo',
                    render: (p: any) => {
                      const c = (curriculos as any[]).find((x)=> x.id === (p.curriculoId || p.curriculo?.id));
                      return c?.versao || '—';
                    },
                  },
                  {
                    key: 'curso',
                    header: 'Curso',
                    render: (p: Periodo) => p.curso?.nome || cursos.find((c) => c.id === p.cursoId)?.nome || '—',
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
                    header: 'Ações',
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
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(p.id)}
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
                              {periodo.nome || `Período ${periodo.numero}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {periodo.curso?.nome || cursos.find((c) => c.id === periodo.cursoId)?.nome || 'Curso não informado'}
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
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(periodo.id)}
                                disabled={deleteMutation.isPending}
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4" />
                          <span>
                            {periodo.curso?.grau || cursos.find((c) => c.id === periodo.cursoId)?.grau || 'Grau não informado'}
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
                    Nenhum período encontrado
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
