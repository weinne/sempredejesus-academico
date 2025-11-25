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
import { Plus, Calendar as CalendarIcon, List as ListIcon, Filter, X } from 'lucide-react';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { cn } from '@/lib/utils';

export default function AulasListPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [disciplinaId, setDisciplinaId] = useState<number | ''>('');
  const [professorId, setProfessorId] = useState<string | ''>('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'data', desc: true }]);
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('ultimos-30');

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
    if (viewMode !== 'table') {
      return { dataInicio: undefined, dataFim: undefined };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const [tipo, dias] = periodoFiltro.split('-');
    const numDias = Number(dias);

    if (tipo === 'ultimos') {
      const dataInicio = new Date(hoje);
      dataInicio.setDate(dataInicio.getDate() - numDias);
      return {
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: hoje.toISOString().split('T')[0],
      };
    } else if (tipo === 'proximos') {
      const dataFim = new Date(hoje);
      dataFim.setDate(dataFim.getDate() + numDias);
      return {
        dataInicio: hoje.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
      };
    }

    return { dataInicio: undefined, dataFim: undefined };
  }, [periodoFiltro, viewMode]);

  const { data: aulasResp, refetch, isLoading } = useQuery({
    queryKey: ['aulas', turmaId, disciplinaId, professorId, periodoDatas.dataInicio, periodoDatas.dataFim],
    queryFn: () =>
      apiService
        .getAulas({
          turmaId: typeof turmaId === 'number' ? turmaId : undefined,
          disciplinaId: typeof disciplinaId === 'number' ? disciplinaId : undefined,
          professorId:
            hasRole([Role.ADMIN, Role.SECRETARIA]) && professorId ? professorId : undefined,
          dataInicio: periodoDatas.dataInicio,
          dataFim: periodoDatas.dataFim,
          sortBy: 'data',
          sortOrder: 'desc',
        })
        .then((r) => r.data),
    enabled: typeof turmaId === 'number' || typeof disciplinaId === 'number' || !!professorId,
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
              <Button variant="outline" size="sm" asChild>
                <Link to={`/aulas/edit/${row.original.id}`}>Editar</Link>
              </Button>
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
  const calendarEvents = useMemo(() => {
    if (!aulas || aulas.length === 0) return [];
    
    // Group by date
    const grouped: Record<string, Aula[]> = {};
    aulas.forEach((aula) => {
      if (!grouped[aula.data]) grouped[aula.data] = [];
      grouped[aula.data].push(aula);
    });
    
    return Object.entries(grouped).map(([date, aulasOnDate]) => ({
      date,
      aulas: aulasOnDate,
    }));
  }, [aulas]);

  const activeFiltersCount = [turmaId, disciplinaId, professorId].filter(Boolean).length;

  const clearFilters = () => {
    setTurmaId('');
    setDisciplinaId('');
    setProfessorId('');
    setGlobalFilter('');
    setPeriodoFiltro('ultimos-30');
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

                {(turmaId || disciplinaId || professorId || globalFilter || (viewMode === 'table' && periodoFiltro !== 'ultimos-30')) && (
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
                <div className="rounded-md border">
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
                  <CardDescription>Visualização mensal</CardDescription>
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
              ) : calendarEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma aula encontrada. Selecione filtros ou crie uma nova aula.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calendarEvents.map(({ date, aulas: aulasOnDate }) => {
                    const dateObj = new Date(date);
                    return (
                      <Card key={date} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {dateObj.toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {aulasOnDate.map((aula) => (
                            <div
                              key={aula.id}
                              className="p-2 bg-gray-50 rounded border border-gray-200"
                            >
                              <div className="font-medium text-sm">
                                {aula.horaInicio && aula.horaFim
                                  ? `${aula.horaInicio} - ${aula.horaFim}`
                                  : 'Horário não definido'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {aula.topico || 'Sem tópico'}
                              </div>
                              <div className="mt-2 flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/aulas/view/${aula.id}`}>Ver</Link>
                                </Button>
                                {canEdit && (
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/aulas/edit/${aula.id}`}>Editar</Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </main>
    </div>
  );
}

