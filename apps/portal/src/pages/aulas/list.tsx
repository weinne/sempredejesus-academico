import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { usePageHero } from '@/hooks/use-page-hero';
import { apiService } from '@/services/api';
import { Aula, Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { Plus, Calendar as CalendarIcon, List as ListIcon, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { cn } from '@/lib/utils';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getMonthStart = (date: Date) => {
  const normalized = new Date(date);
  normalized.setDate(1);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export default function AulasListPage() {
  const { hasRole, user } = useAuth();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);
  const isPrivileged = hasRole([Role.ADMIN, Role.SECRETARIA]);
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [disciplinaId, setDisciplinaId] = useState<number | ''>('');
  const [professorId, setProfessorId] = useState<string | ''>('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'data', desc: true }]);
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('mes-atual');
  const [currentMonth, setCurrentMonth] = useState<Date>(() => getMonthStart(new Date()));

  // Initialize turmaId from URL params
  useEffect(() => {
    const turmaIdParam = searchParams.get('turmaId');
    if (turmaIdParam) {
      setTurmaId(Number(turmaIdParam));
    }
  }, [searchParams]);

  // Fetch options
  const { data: turmasOptions = [] } = useQuery({
    queryKey: ['turmas-options'],
    queryFn: () => apiService.getTurmas({ limit: 1000 }).then((r) => r.data),
  });
  const { data: disciplinasOptions = [] } = useQuery({
    queryKey: ['disciplinas-options'],
    queryFn: () => apiService.getDisciplinas({ limit: 1000 }).then((r) => r.data),
  });
  const { data: professoresOptions = [] } = useQuery({
    queryKey: ['professores-options'],
    queryFn: () => apiService.getProfessores({ limit: 1000 }).then((r) => r.data),
    enabled: hasRole([Role.ADMIN, Role.SECRETARIA]),
  });

  // Calcular datas do período selecionado
  const periodoDatas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (viewMode === 'calendar') {
      const inicioMesCalendario = getMonthStart(currentMonth);
      const fimMesCalendario = new Date(inicioMesCalendario);
      fimMesCalendario.setMonth(fimMesCalendario.getMonth() + 1);
      fimMesCalendario.setDate(0);

      return {
        dataInicio: formatDate(inicioMesCalendario),
        dataFim: formatDate(fimMesCalendario),
      };
    }

    if (periodoFiltro === 'mes-atual') {
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(inicioMes);
      fimMes.setMonth(fimMes.getMonth() + 1);
      fimMes.setDate(0);

      return {
        dataInicio: formatDate(inicioMes),
        dataFim: formatDate(fimMes),
      };
    }

    if (periodoFiltro === 'semana-atual') {
      const inicioSemana = new Date(hoje);
      const day = inicioSemana.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      inicioSemana.setDate(inicioSemana.getDate() + diff);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);

      return {
        dataInicio: formatDate(inicioSemana),
        dataFim: formatDate(fimSemana),
      };
    }

    if (periodoFiltro === 'ano-atual') {
      const inicioAno = new Date(hoje.getFullYear(), 0, 1);
      const fimAno = new Date(hoje.getFullYear(), 11, 31);

      return {
        dataInicio: formatDate(inicioAno),
        dataFim: formatDate(fimAno),
      };
    }

    const [tipo, dias] = periodoFiltro.split('-');
    const numDias = Number(dias);

    if (tipo === 'ultimos') {
      const dataInicio = new Date(hoje);
      dataInicio.setDate(dataInicio.getDate() - numDias);
      return {
        dataInicio: formatDate(dataInicio),
        dataFim: formatDate(hoje),
      };
    } else if (tipo === 'proximos') {
      const dataFim = new Date(hoje);
      dataFim.setDate(dataFim.getDate() + numDias);
      return {
        dataInicio: formatDate(hoje),
        dataFim: formatDate(dataFim),
      };
    }

    return { dataInicio: undefined, dataFim: undefined };
  }, [periodoFiltro, viewMode, currentMonth]);

  const professorFilter = isPrivileged && professorId ? professorId : undefined;
  const calendarKey = viewMode === 'calendar' ? currentMonth.getTime() : null;

  const { data: aulasResp, refetch, isLoading } = useQuery({
    queryKey: ['aulas', turmaId, disciplinaId, professorFilter, periodoDatas.dataInicio, periodoDatas.dataFim, calendarKey],
    queryFn: () =>
      apiService
        .getAulas({
          turmaId: typeof turmaId === 'number' ? turmaId : undefined,
          disciplinaId: typeof disciplinaId === 'number' ? disciplinaId : undefined,
          professorId: professorFilter,
          dataInicio: periodoDatas.dataInicio,
          dataFim: periodoDatas.dataFim,
          sortBy: 'data',
          sortOrder: 'desc',
        })
        .then((r) => r.data),
    enabled: !!user,
  });
  const aulas = aulasResp || [];

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!aulas || aulas.length === 0) {
      return [
        { value: 0, label: 'Total de Aulas' },
        { value: 0, label: 'Hoje' },
        { value: 0, label: 'Esta Semana' },
        { value: 0, label: 'Turmas' },
      ];
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() + 7);

    const aulasHoje = aulas.filter((aula) => {
      if (!aula.data) return false;
      const dataAula = new Date(aula.data);
      dataAula.setHours(0, 0, 0, 0);
      return dataAula.getTime() === hoje.getTime();
    }).length;

    const aulasEstaSemana = aulas.filter((aula) => {
      if (!aula.data) return false;
      const dataAula = new Date(aula.data);
      return dataAula >= hoje && dataAula < fimSemana;
    }).length;

    const turmasUnicas = new Set(aulas.filter((a) => a.turmaId).map((a) => a.turmaId)).size;

    return [
      { value: aulas.length, label: 'Total de Aulas' },
      { value: aulasHoje, label: 'Hoje' },
      { value: aulasEstaSemana, label: 'Esta Semana' },
      { value: turmasUnicas, label: 'Turmas' },
    ];
  }, [aulas]);

  const columns = useMemo<ColumnDef<Aula>[]>(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        cell: (info) => {
          const date = new Date(info.getValue() as string);
          return date.toLocaleDateString('pt-BR');
        },
      },
      {
        accessorKey: 'horaInicio',
        header: 'Hora Início',
        cell: (info) => info.getValue() || '-',
      },
      {
        accessorKey: 'horaFim',
        header: 'Hora Fim',
        cell: (info) => info.getValue() || '-',
      },
      {
        accessorKey: 'topico',
        header: 'Tópico',
        cell: (info) => info.getValue() || '-',
      },
      {
        accessorKey: 'observacao',
        header: 'Observação',
        cell: (info) => info.getValue() || '-',
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/aulas/view/${row.original.id}`}>Ver</Link>
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/aulas/edit/${row.original.id}`}>Editar</Link>
                </Button>
                <Button variant="secondary" size="sm" asChild disabled={!row.original.turmaId}>
                  <Link
                    to={`/presencas?aulaId=${row.original.id}${
                      row.original.turmaId ? `&turmaId=${row.original.turmaId}` : ''
                    }`}
                  >
                    Registrar aula
                  </Link>
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [canEdit]
  );

  const table = useReactTable({
    data: aulas,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Calendar view logic
  const eventsByDate = useMemo(() => {
    if (!aulas || aulas.length === 0) return {} as Record<string, Aula[]>;

    const grouped = aulas.reduce((acc, aula) => {
      if (!aula.data) return acc;
      if (!acc[aula.data]) acc[aula.data] = [];
      acc[aula.data].push(aula);
      return acc;
    }, {} as Record<string, Aula[]>);

    Object.values(grouped).forEach((aulasDoDia) => {
      aulasDoDia.sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || ''));
    });

    return grouped;
  }, [aulas]);

  const calendarDays = useMemo(() => {
    const startOfMonth = getMonthStart(currentMonth);
    const firstWeekday = startOfMonth.getDay();
    const firstGridDate = new Date(startOfMonth);
    firstGridDate.setDate(firstGridDate.getDate() - firstWeekday);

    const days: { date: Date; inCurrentMonth: boolean; iso: string }[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(firstGridDate);
      day.setDate(firstGridDate.getDate() + i);
      days.push({
        date: day,
        inCurrentMonth: day.getMonth() === startOfMonth.getMonth(),
        iso: formatDate(day),
      });
    }

    return days;
  }, [currentMonth]);

  const activeFiltersCount = [turmaId, disciplinaId, professorId].filter(Boolean).length;

  const clearFilters = () => {
    setTurmaId('');
    setDisciplinaId('');
    setProfessorId('');
    setGlobalFilter('');
    setPeriodoFiltro('mes-atual');
    setCurrentMonth(getMonthStart(new Date()));
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return getMonthStart(next);
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return getMonthStart(next);
    });
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth((prev) => getMonthStart(new Date(prev.getFullYear(), monthIndex, 1)));
  };

  const handleYearChange = (yearValue: number) => {
    if (Number.isNaN(yearValue)) return;
    setCurrentMonth((prev) => getMonthStart(new Date(yearValue, prev.getMonth(), 1)));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(getMonthStart(new Date()));
  };

  // Configure Hero via hook
  usePageHero({
    title: "Aulas",
    description: "Listagem de aulas cadastradas",
    backTo: "/dashboard",
    stats: stats,
    actions: canEdit ? (
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/aulas/batch">
            <Plus className="h-4 w-4 mr-2" />
            Criar em Lote
          </Link>
        </Button>
        <Button asChild>
          <Link to="/aulas/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Aula
          </Link>
        </Button>
      </div>
    ) : undefined
  });

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          <CrudToolbar
            search={viewMode === 'table' ? globalFilter : undefined}
            onSearchChange={viewMode === 'table' ? (value) => setGlobalFilter(value) : undefined}
            searchPlaceholder="Buscar por tópico, observação..."
            viewMode={viewMode === 'table' ? 'table' : 'card'}
            onViewModeChange={(mode) => {
              // Não permitir mudança manual do viewMode aqui, pois temos dois modos customizados (table/calendar)
            }}
            filtersSlot={
              <div className="flex flex-wrap gap-2 items-center min-w-0">
                {viewMode === 'table' && (
                  <select
                    className={cn(
                      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                      "min-w-[160px] w-auto"
                    )}
                    aria-label="Período"
                    value={periodoFiltro}
                    onChange={(e) => setPeriodoFiltro(e.target.value)}
                  >
                    <optgroup label="Períodos atuais">
                      <option value="semana-atual">Semana Atual</option>
                      <option value="mes-atual">Mês Atual</option>
                      <option value="ano-atual">Ano Atual</option>
                    </optgroup>
                    <optgroup label="Últimos dias">
                      <option value="ultimos-30">Últimos 30 dias</option>
                      <option value="ultimos-60">Últimos 60 dias</option>
                      <option value="ultimos-90">Últimos 90 dias</option>
                      <option value="ultimos-180">Últimos 180 dias</option>
                    </optgroup>
                    <optgroup label="Próximos dias">
                      <option value="proximos-30">Próximos 30 dias</option>
                      <option value="proximos-60">Próximos 60 dias</option>
                      <option value="proximos-90">Próximos 90 dias</option>
                      <option value="proximos-180">Próximos 180 dias</option>
                    </optgroup>
                  </select>
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal lg:hidden">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Filtros Avançados</h4>
                        <p className="text-sm text-muted-foreground">
                          Refine a lista de aulas
                        </p>
                      </div>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="turma">Turma</Label>
                          <select
                            id="turma"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={typeof turmaId === 'number' ? String(turmaId) : ''}
                            onChange={(e) => setTurmaId(e.target.value ? Number(e.target.value) : '')}
                          >
                            <option value="">Todas as turmas</option>
                            {turmasOptions.map((t: any) => (
                              <option key={t.id} value={t.id}>
                                {t.id} - {t.disciplina?.nome || 'Turma'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="disciplina">Disciplina</Label>
                          <select
                            id="disciplina"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={typeof disciplinaId === 'number' ? String(disciplinaId) : ''}
                            onChange={(e) => setDisciplinaId(e.target.value ? Number(e.target.value) : '')}
                          >
                            <option value="">Todas as disciplinas</option>
                            {disciplinasOptions.map((d: any) => (
                              <option key={d.id} value={d.id}>
                                {d.codigo ? `${d.codigo} - ${d.nome}` : d.nome}
                              </option>
                            ))}
                          </select>
                        </div>

                        {hasRole([Role.ADMIN, Role.SECRETARIA]) && (
                          <div className="grid gap-2">
                            <Label htmlFor="professor">Professor</Label>
                            <select
                              id="professor"
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              value={professorId || ''}
                              onChange={(e) => setProfessorId(e.target.value)}
                            >
                              <option value="">Todos os professores</option>
                              {professoresOptions.map((p: any) => (
                                <option key={p.matricula} value={p.matricula}>
                                  {p.pessoa?.nomeCompleto || p.matricula}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Filtros ativos badges */}
                <div className="hidden lg:flex gap-2">
                   {activeFiltersCount > 0 && (
                      <>
                        {turmaId && <Badge variant="secondary" className="rounded-sm px-1 font-normal">Turma: {turmaId}</Badge>}
                        {disciplinaId && <Badge variant="secondary" className="rounded-sm px-1 font-normal">Disciplina: {disciplinaId}</Badge>}
                        {professorId && <Badge variant="secondary" className="rounded-sm px-1 font-normal">Prof: {professorId}</Badge>}
                      </>
                   )}
                </div>

                {(turmaId || disciplinaId || professorId || globalFilter || (viewMode === 'table' && periodoFiltro !== 'mes-atual')) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-2 lg:px-3"
                  >
                    Limpar
                    <X className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            }
          />

        {/* Table view */}
        {viewMode === 'table' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Aulas ({aulas.length})</CardTitle>
                <div className="flex gap-1 border rounded-md p-0.5 bg-muted/30">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 px-2 sm:px-3"
                  >
                    <ListIcon className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Tabela</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="h-8 px-2 sm:px-3"
                  >
                    <CalendarIcon className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Calendário</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : aulas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma aula encontrada. Selecione filtros ou crie uma nova aula.
                </div>
              ) : (
                <>
                  <div className="space-y-3 lg:hidden">
                    {aulas.map((aula) => (
                      <div key={aula.id} className="rounded-lg border p-4 shadow-sm bg-white">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Data</p>
                            <p className="font-semibold">
                              {aula.data ? new Date(aula.data).toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                          <Badge variant="outline">{aula.turmaId ? `Turma #${aula.turmaId}` : 'Sem turma'}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Início</p>
                            <p className="font-medium">{aula.horaInicio || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fim</p>
                            <p className="font-medium">{aula.horaFim || '-'}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-muted-foreground text-sm">Tópico</p>
                          <p className="text-sm font-medium">{aula.topico || 'Sem tópico definido'}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/aulas/view/${aula.id}`}>Ver</Link>
                          </Button>
                          {canEdit && (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/aulas/edit/${aula.id}`}>Editar</Link>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                asChild
                                disabled={!aula.turmaId}
                              >
                                <Link
                                  to={`/presencas?aulaId=${aula.id}${
                                    aula.turmaId ? `&turmaId=${aula.turmaId}` : ''
                                  }`}
                                >
                                  Registrar aula
                                </Link>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden lg:block rounded-md border">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder ? null : (
                                  <div
                                    {...{
                                      className: header.column.getCanSort()
                                        ? 'cursor-pointer select-none'
                                        : '',
                                      onClick: header.column.getToggleSortingHandler(),
                                    }}
                                  >
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                    {{
                                      asc: ' 🔼',
                                      desc: ' 🔽',
                                    }[header.column.getIsSorted() as string] ?? null}
                                  </div>
                                )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Calendar view */}
        {viewMode === 'calendar' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Calendário de Aulas</CardTitle>
                  <CardDescription>Visualização mensal estilo agenda</CardDescription>
                </div>
                <div className="flex gap-1 border rounded-md p-0.5 bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 px-2 sm:px-3"
                  >
                    <ListIcon className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Tabela</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="h-8 px-2 sm:px-3"
                  >
                    <CalendarIcon className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Calendário</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : aulas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma aula encontrada. Selecione filtros ou crie uma nova aula.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={goToPreviousMonth} aria-label="Mês anterior">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-lg font-semibold capitalize">
                        {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </div>
                      <Button variant="ghost" size="icon" onClick={goToNextMonth} aria-label="Próximo mês">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
                        Hoje
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <select
                        className="rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={currentMonth.getMonth()}
                        onChange={(e) => handleMonthSelect(Number(e.target.value))}
                      >
                        {monthNames.map((name, index) => (
                          <option key={name} value={index}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="w-24 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={currentMonth.getFullYear()}
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          handleYearChange(Number(e.target.value));
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-7 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map(({ date, inCurrentMonth, iso }) => {
                      const dayEvents = eventsByDate[iso] || [];
                      return (
                        <div
                          key={`${iso}-${inCurrentMonth ? 'current' : 'adjacent'}`}
                          className={cn(
                            "min-h-[120px] border rounded-md p-2 flex flex-col gap-1 bg-white",
                            !inCurrentMonth && "bg-muted/40 text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>{date.getDate()}</span>
                            {dayEvents.length > 0 && (
                              <Badge variant="secondary" className="ml-2 text-[10px]">
                                {dayEvents.length}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 space-y-1 overflow-y-auto">
                            {dayEvents.length === 0 ? (
                              <span className="text-[11px] text-muted-foreground">Sem aulas</span>
                            ) : (
                              dayEvents.map((aula) => (
                                <Link
                                  key={aula.id}
                                  to={`/aulas/view/${aula.id}`}
                                  className={cn(
                                    "block rounded border px-2 py-1 text-xs truncate",
                                    canEdit
                                      ? "bg-blue-50 text-blue-900 border-blue-100 hover:bg-blue-100"
                                      : "bg-slate-100 text-slate-900 border-slate-200"
                                  )}
                                >
                                  <span className="font-semibold">
                                    {aula.horaInicio ? aula.horaInicio : 'Sem horário'}
                                  </span>
                                  {aula.topico && <span className="ml-1">• {aula.topico}</span>}
                                </Link>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </main>
    </div>
  );
}

