import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { Curso, Role, Periodo, Disciplina, Curriculo, Turno } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  BookOpen,
  Edit,
  Calendar,
  Layers3,
  Clock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

function formatGrauBadge(grau: string) {
  switch (grau?.toUpperCase()) {
    case 'BACHARELADO':
      return 'bg-blue-500/10 text-blue-600';
    case 'LICENCIATURA':
      return 'bg-emerald-500/10 text-emerald-600';
    case 'ESPECIALIZACAO':
      return 'bg-purple-500/10 text-purple-600';
    case 'MESTRADO':
      return 'bg-orange-500/10 text-orange-600';
    case 'DOUTORADO':
      return 'bg-rose-500/10 text-rose-600';
    default:
      return 'bg-slate-500/10 text-slate-600';
  }
}

export default function CursoViewPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [selectedTurnoId, setSelectedTurnoId] = React.useState<number | null>(null);
  const [selectedCurriculoId, setSelectedCurriculoId] = React.useState<number | null>(null);
  const [selectedPeriodoId, setSelectedPeriodoId] = React.useState<number | null>(null);

  const {
    data: curso,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['curso', id],
    queryFn: () => apiService.getCurso(Number(id)),
    enabled: !!id,
    retry: false,
  });

  // Buscar períodos do curso
  const { data: periodosResponse } = useQuery({
    queryKey: ['periodos', 'curso', id],
    queryFn: () => apiService.getPeriodos({ cursoId: Number(id), limit: 100 }),
    enabled: !!id,
  });
  const periodos = periodosResponse?.data || [];

  // Buscar disciplinas do curso
  const { data: disciplinasResponse } = useQuery({
    queryKey: ['disciplinas', 'curso', id],
    queryFn: () => apiService.getDisciplinas({ cursoId: Number(id), limit: 100 }),
    enabled: !!id,
  });
  const disciplinas = disciplinasResponse?.data || [];

  // Buscar currículos do curso
  const { data: curriculos = [] } = useQuery({
    queryKey: ['curriculos', 'curso', id],
    queryFn: () => apiService.getCurriculos({ cursoId: Number(id) }),
    enabled: !!id,
  });

  const calculatePeriodTotals = (disciplinasDoPeriodo: any[]) => {
    let totalCreditos = 0;
    let totalCargaHoraria = 0;

    disciplinasDoPeriodo.forEach(disciplina => {
      const creditos = Number(disciplina.creditos);
      const cargaHoraria = Number(disciplina.cargaHoraria);

      if (Number.isFinite(creditos)) {
        totalCreditos += creditos;
      }
      if (Number.isFinite(cargaHoraria)) {
        totalCargaHoraria += cargaHoraria;
      }
    });

    return { totalCreditos, totalCargaHoraria };
  };

  const turnoOptions = React.useMemo(() => {
    const map = new Map<
      number,
      { turno: Turno | null; label: string; curriculos: Curriculo[] }
    >();

    curriculos.forEach((curriculo) => {
      const periodoRelacionado = periodos.find((periodo) => periodo.curriculoId === curriculo.id);
      const turnoInfo = curriculo.turno || periodoRelacionado?.turno || null;
      const label = turnoInfo?.nome || `Turno ${curriculo.turnoId}`;
      if (!map.has(curriculo.turnoId)) {
        map.set(curriculo.turnoId, {
          turno: turnoInfo,
          label,
          curriculos: [],
        });
      }
      map.get(curriculo.turnoId)!.curriculos.push(curriculo);
    });

    return Array.from(map.entries())
      .map(([turnoId, payload]) => ({
        turnoId,
        ...payload,
        curriculos: payload.curriculos.sort((a, b) => Number(b.ativo) - Number(a.ativo)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [curriculos, periodos]);

  React.useEffect(() => {
    if (selectedTurnoId === null && turnoOptions.length > 0) {
      const preferActive = turnoOptions.find((option) =>
        option.curriculos.some((curriculo) => curriculo.ativo),
      );
      setSelectedTurnoId((preferActive ?? turnoOptions[0]).turnoId);
    }
  }, [turnoOptions, selectedTurnoId]);

  React.useEffect(() => {
    if (selectedTurnoId === null) {
      setSelectedCurriculoId(null);
      return;
    }
    const group = turnoOptions.find((option) => option.turnoId === selectedTurnoId);
    if (!group) {
      setSelectedCurriculoId(null);
      return;
    }
    if (!group.curriculos.some((curriculo) => curriculo.id === selectedCurriculoId)) {
      const defaultCurriculo = group.curriculos.find((curriculo) => curriculo.ativo) ?? group.curriculos[0];
      setSelectedCurriculoId(defaultCurriculo?.id ?? null);
    }
  }, [selectedTurnoId, turnoOptions, selectedCurriculoId]);

  const curriculoPeriodos = React.useMemo(() => {
    if (!selectedCurriculoId) {
      return [];
    }
    return periodos
      .filter((periodo) => periodo.curriculoId === selectedCurriculoId)
      .sort((a, b) => a.numero - b.numero);
  }, [periodos, selectedCurriculoId]);

  React.useEffect(() => {
    if (!selectedCurriculoId) {
      setSelectedPeriodoId(null);
      return;
    }
    if (!curriculoPeriodos.some((periodo) => periodo.id === selectedPeriodoId)) {
      setSelectedPeriodoId(curriculoPeriodos[0]?.id ?? null);
    }
  }, [selectedCurriculoId, curriculoPeriodos, selectedPeriodoId]);

  const { data: periodoDetalhado, isLoading: isPeriodoDetalheLoading } = useQuery({
    queryKey: ['periodo-detalhe', selectedPeriodoId],
    queryFn: () => apiService.getPeriodo(Number(selectedPeriodoId)),
    enabled: Boolean(selectedPeriodoId),
  });

  const selectedCurriculo = curriculos.find((curriculo) => curriculo.id === selectedCurriculoId);
  const selectedTurno = turnoOptions.find((option) => option.turnoId === selectedTurnoId);
  const selectedPeriodo =
    periodoDetalhado ||
    curriculoPeriodos.find((periodo) => periodo.id === selectedPeriodoId) ||
    null;
  const disciplinasDoPeriodo = selectedPeriodo?.disciplinas ?? [];

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Curso não encontrado</h2>
              <p className="text-slate-600 mb-4">O curso solicitado não foi encontrado ou não existe.</p>
              <Link to="/cursos">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar aos Cursos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header simplificado */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/cursos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{curso.nome}</h1>
                  <Badge className={formatGrauBadge(curso.grau)}>{curso.grau}</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {periodos.length} {periodos.length === 1 ? 'período' : 'períodos'} • {disciplinas.length} {disciplinas.length === 1 ? 'disciplina' : 'disciplinas'}
                </p>
              </div>
            </div>
            {canEdit && (
              <Link to={`/cursos/edit/${curso.id}`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

          {/* Mapa Curricular - único card principal */}
          {curriculos.length > 0 ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Layers3 className="h-6 w-6 mr-2 text-indigo-600" />
                  Mapa Curricular
                </CardTitle>
                <CardDescription>
                  Explore a estrutura do curso por turno, currículo e período
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                        Turnos
                      </label>
                      <span className="text-xs text-slate-400">
                        {turnoOptions.length} {turnoOptions.length === 1 ? 'turno' : 'turnos'}
                      </span>
                    </div>
                    {turnoOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {turnoOptions.map((option) => {
                          const isSelected = option.turnoId === selectedTurnoId;
                          return (
                            <button
                              type="button"
                              key={option.turnoId}
                              onClick={() => setSelectedTurnoId(option.turnoId)}
                              className={cn(
                                'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition shadow-sm',
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700',
                              )}
                            >
                              <span>{option.label}</span>
                              <Badge
                                variant={option.curriculos.some((curriculo) => curriculo.ativo) ? 'default' : 'secondary'}
                                className="text-[10px]"
                              >
                                {option.curriculos.filter((curriculo) => curriculo.ativo).length}/{option.curriculos.length} ativos
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Nenhum turno encontrado para este curso.</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                        Currículos do turno selecionado
                      </label>
                      <span className="text-xs text-slate-400">
                        {selectedTurno?.curriculos.length ?? 0}{' '}
                        {(selectedTurno?.curriculos.length ?? 0) === 1 ? 'currículo' : 'currículos'}
                      </span>
                    </div>
                    {selectedTurno ? (
                      selectedTurno.curriculos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedTurno.curriculos.map((curriculo) => {
                            const isSelected = curriculo.id === selectedCurriculoId;
                            return (
                              <button
                                type="button"
                                key={curriculo.id}
                                onClick={() => setSelectedCurriculoId(curriculo.id)}
                                className={cn(
                                  'rounded-full border px-4 py-1.5 text-sm transition shadow-sm flex items-center gap-2',
                                  isSelected
                                    ? 'border-purple-600 bg-purple-600 text-white shadow-lg'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:text-purple-700',
                                )}
                              >
                                <span>Versão {curriculo.versao}</span>
                                <Badge variant={curriculo.ativo ? 'default' : 'secondary'}>
                                  {curriculo.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Nenhum currículo cadastrado neste turno.</p>
                      )
                    ) : (
                      <p className="text-sm text-slate-500">Escolha um turno para visualizar currículos.</p>
                    )}
                  </div>

                  {/* Seleção de Períodos */}
                  {selectedCurriculo && curriculoPeriodos.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                          Períodos
                        </label>
                        <span className="text-xs text-slate-500">
                          {curriculoPeriodos.length} {curriculoPeriodos.length === 1 ? 'período' : 'períodos'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {curriculoPeriodos.map((periodo) => {
                          const isSelected = periodo.id === selectedPeriodoId;
                          return (
                            <button
                              type="button"
                              key={periodo.id}
                              onClick={() => setSelectedPeriodoId(periodo.id)}
                              className={cn(
                                'rounded-full border px-4 py-1.5 text-sm transition shadow-sm flex items-center gap-2',
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700',
                              )}
                            >
                              <span>{periodo.nome || `Período ${periodo.numero}`}</span>
                              <Badge variant="secondary" className="text-xs">
                                {periodo.totalDisciplinas ?? 0}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        {selectedPeriodo?.nome || (selectedPeriodo ? `Período ${selectedPeriodo.numero}` : 'Período não selecionado')}
                      </h4>
                      {selectedPeriodo && (
                        <p className="text-sm text-slate-500">
                          {selectedPeriodo.descricao || 'Sem descrição cadastrada'}
                        </p>
                      )}
                    </div>
                    {selectedPeriodo && (
                      <Badge variant="outline" className="text-xs text-slate-600">
                        Nº {selectedPeriodo.numero}
                      </Badge>
                    )}
                  </div>

                  {selectedPeriodoId ? (
                    isPeriodoDetalheLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
                        Carregando disciplinas do período...
                      </div>
                    ) : disciplinasDoPeriodo.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {disciplinasDoPeriodo.map((disciplina) => (
                          <div
                            key={disciplina.id}
                            className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
                                    {disciplina.codigo}
                                  </p>
                                  <h5 className="text-base font-semibold text-slate-900 leading-tight">
                                    {disciplina.nome}
                                  </h5>
                                </div>
                                <Badge variant="outline" className="shrink-0">
                                  {disciplina.creditos} {disciplina.creditos === 1 ? 'crédito' : 'créditos'}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-slate-400" />
                                  <span>{disciplina.cargaHoraria}h</span>
                                </div>
                                <div className="h-4 w-px bg-slate-200"></div>
                                <Badge variant={disciplina.obrigatoria === false ? 'secondary' : 'default'} className="text-xs">
                                  {disciplina.obrigatoria === false ? 'Optativa' : 'Obrigatória'}
                                </Badge>
                              </div>

                              {disciplina.ementa && (
                                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                  {disciplina.ementa}
                                </p>
                              )}

                              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                                {disciplina.ordem && (
                                  <span className="text-xs text-slate-500">
                                    Ordem: {disciplina.ordem}
                                  </span>
                                )}
                                <Link to={`/disciplinas/view/${disciplina.id}`} className="ml-auto">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs group-hover:bg-slate-100"
                                  >
                                    Ver detalhes
                                    <ArrowRight className="ml-1 h-3 w-3" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(() => {
                          const { totalCreditos, totalCargaHoraria } = calculatePeriodTotals(disciplinasDoPeriodo);
                          return disciplinasDoPeriodo.length > 0 ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-800">Totais do período:</span>
                                <div className="flex gap-4">
                                  <span className="text-blue-700">
                                    <strong>{totalCreditos}</strong> {totalCreditos === 1 ? 'crédito' : 'créditos'}
                                  </span>
                                  <span className="text-blue-700">
                                    <strong>{totalCargaHoraria}h</strong> carga horária
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                        Nenhuma disciplina vinculada a este período ainda.
                      </div>
                    )
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                      Escolha um período para visualizar as disciplinas correspondentes.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center">
                <Layers3 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Nenhum currículo cadastrado
                </h3>
                <p className="text-slate-500">
                  Configure turnos e currículos para visualizar o mapa curricular do curso.
                </p>
                {canEdit && (
                  <Link to={`/cursos/wizard?cursoId=${curso.id}`} className="inline-block mt-4">
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Configurar Estrutura
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}