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
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Aula, Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { Plus, Calendar as CalendarIcon, List as ListIcon, Search } from 'lucide-react';

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

  const { data: aulasResp, refetch, isLoading } = useQuery({
    queryKey: ['aulas', turmaId, disciplinaId, professorId],
    queryFn: () =>
      apiService
        .getAulas({
          turmaId: typeof turmaId === 'number' ? turmaId : undefined,
          disciplinaId: typeof disciplinaId === 'number' ? disciplinaId : undefined,
          professorId:
            hasRole([Role.ADMIN, Role.SECRETARIA]) && professorId ? professorId : undefined,
          sortBy: 'data',
          sortOrder: 'desc',
        })
        .then((r) => r.data),
    enabled: typeof turmaId === 'number' || typeof disciplinaId === 'number' || !!professorId,
  });
  const aulas = aulasResp || [];

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

  const clearFilters = () => {
    setTurmaId('');
    setDisciplinaId('');
    setProfessorId('');
    setGlobalFilter('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title="Aulas"
        description="Listagem de aulas cadastradas"
        backTo="/dashboard"
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Turma</label>
              <select
                className="border rounded px-2 py-2 w-56"
                aria-label="Turma"
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

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Disciplina</label>
              <select
                className="border rounded px-2 py-2 w-56"
                aria-label="Disciplina"
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
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Professor</label>
                <select
                  className="border rounded px-2 py-2 w-64"
                  aria-label="Professor"
                  value={professorId || ''}
                  onChange={(e) => setProfessorId(e.target.value)}
                >
                  <option value="">Todos os professores</option>
                  {professoresOptions.map((p: any) => (
                    <option key={p.matricula} value={p.matricula}>
                      {p.pessoa?.nome || p.matricula}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="ml-auto flex items-end gap-2">
              <Button onClick={clearFilters}>Limpar filtros</Button>
              {canEdit && (
                <>
                  <Button asChild>
                    <Link to="/aulas/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Aula
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/aulas/batch">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar em Lote
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* View mode toggle */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
            >
              <ListIcon className="h-4 w-4 mr-2" />
              Tabela
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendário
            </Button>
          </div>
          {viewMode === 'table' && (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-64"
              />
            </div>
          )}
        </div>

        {/* Table view */}
        {viewMode === 'table' && (
          <Card>
            <CardHeader>
              <CardTitle>Aulas ({aulas.length})</CardTitle>
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
              <CardTitle>Calendário de Aulas</CardTitle>
              <CardDescription>Visualização mensal</CardDescription>
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
      </main>
    </div>
  );
}

