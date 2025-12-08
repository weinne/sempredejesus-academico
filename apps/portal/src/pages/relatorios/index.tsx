import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageHero } from '@/hooks/use-page-hero';
import { StatCard } from '@/components/ui/stats-card';
import { SearchSelect } from '@/components/form/search-select';
import { Search, BarChart3, FileText, TrendingUp, CheckCircle, Loader2, Printer, Download, RefreshCw } from 'lucide-react';
import { apiService } from '@/services/api';
import type {
  Aluno,
  Coorte,
  Curso,
  DesempenhoReport,
  FrequenciaReportResponse,
  HistoricoReportItem,
  Periodo,
  Pessoa,
} from '@/types/api';

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatDecimal = (value?: number | string | null) => {
  if (value === null || value === undefined) return '-';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return '-';
  return decimalFormatter.format(numeric);
};

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return `${percentFormatter.format(value)}%`;
};

const mapPessoaFromBackend = (source?: any): Pessoa | undefined => {
  if (!source) return undefined;
  const nome = source.nomeCompleto ?? source.nome ?? '';
  return {
    id: String(source.id ?? source.pessoaId ?? ''),
    nome,
    nomeCompleto: source.nomeCompleto ?? source.nome ?? nome,
    sexo: source.sexo ?? undefined,
    cpf: source.cpf ?? undefined,
    email: source.email ?? undefined,
    telefone: source.telefone ?? undefined,
    endereco: typeof source.endereco === 'string' ? source.endereco : source.endereco ? JSON.stringify(source.endereco) : undefined,
    data_nascimento: source.dataNasc ?? source.data_nascimento ?? undefined,
    created_at: source.createdAt ?? source.created_at ?? '',
    updated_at: source.updatedAt ?? source.updated_at ?? '',
  };
};

const mapAlunoRecord = (record: any): Aluno => {
  const base = record?.alunos ?? record ?? {};
  const cursoSource = record?.cursos ?? base.curso;
  const periodoSource = record?.periodos ?? base.periodo;
  const coorteSource = record?.coortes ?? base.coorte;
  return {
    ra: String(base.ra ?? record?.ra ?? ''),
    pessoaId: Number(base.pessoaId ?? base.pessoa_id ?? record?.pessoaId ?? 0),
    cursoId: Number(base.cursoId ?? base.curso_id ?? cursoSource?.id ?? 0),
    turnoId: base.turnoId ?? base.turno_id ?? null,
    coorteId: base.coorteId ?? base.coorte_id ?? coorteSource?.id ?? undefined,
    periodoId: Number(base.periodoId ?? base.periodo_id ?? periodoSource?.id ?? 0),
    anoIngresso: Number(base.anoIngresso ?? base.ano_ingresso ?? 0),
    igreja: base.igreja ?? undefined,
    situacao: base.situacao ?? 'ATIVO',
    coeficienteAcad: typeof base.coeficienteAcad === 'number'
      ? base.coeficienteAcad
      : base.coeficienteAcad
        ? Number(base.coeficienteAcad)
        : undefined,
    createdAt: base.createdAt ?? base.created_at ?? '',
    updatedAt: base.updatedAt ?? base.updated_at ?? '',
    pessoa: mapPessoaFromBackend(record?.pessoas ?? base.pessoa),
    curso: cursoSource
      ? {
          id: Number(cursoSource.id ?? base.cursoId ?? 0),
          nome: cursoSource.nome ?? '',
          grau: cursoSource.grau ?? '',
        }
      : undefined,
    coorte: coorteSource
      ? {
          id: Number(coorteSource.id ?? base.coorteId ?? 0),
          cursoId: Number(coorteSource.cursoId ?? base.cursoId ?? 0),
          turnoId: Number(coorteSource.turnoId ?? 0),
          curriculoId: Number(coorteSource.curriculoId ?? 0),
          anoIngresso: Number(coorteSource.anoIngresso ?? base.anoIngresso ?? 0),
          rotulo: coorteSource.rotulo ?? '',
          ativo: coorteSource.ativo ?? true,
        }
      : undefined,
    periodo: periodoSource
      ? {
          id: Number(periodoSource.id ?? base.periodoId ?? 0),
          curriculoId: Number(periodoSource.curriculoId ?? 0),
          numero: periodoSource.numero ?? null,
          nome: periodoSource.nome ?? null,
          descricao: periodoSource.descricao ?? null,
          dataInicio: periodoSource.dataInicio ?? undefined,
          dataFim: periodoSource.dataFim ?? undefined,
          totalDisciplinas: periodoSource.totalDisciplinas ?? undefined,
          totalAlunos: periodoSource.totalAlunos ?? undefined,
        }
      : undefined,
  };
};

const normalizeIdValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : String(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return null;
};

const getAlunoCursoId = (aluno: Aluno) => normalizeIdValue(aluno.cursoId ?? aluno.curso?.id);
const getAlunoCoorteId = (aluno: Aluno) => normalizeIdValue(aluno.coorteId ?? aluno.coorte?.id);
const getAlunoPeriodoId = (aluno: Aluno) => normalizeIdValue(aluno.periodoId ?? aluno.periodo?.id);

const getNotaLabel = (nota: HistoricoReportItem['notas'][number]) =>
  nota.descricao?.trim() || nota.tipo || `Avaliação ${nota.avaliacaoId}`;

const resolveResultado = (item: HistoricoReportItem) => {
  const normalized = item.status?.toUpperCase?.() ?? '';
  if (normalized.includes('APROVADO')) return 'APROVADO';
  if (normalized.includes('REPROVADO')) return 'REPROVADO';
  if (!item.media && !item.frequencia) return 'EM ANDAMENTO';
  const mediaOk = (item.media ?? 0) >= 6;
  const freqOk = (item.frequencia ?? 0) >= 75;
  return mediaOk && freqOk ? 'APROVADO' : 'REPROVADO';
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const PRINT_STYLES = `
  body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #0f172a; }
  h1 { margin: 0; font-size: 20px; }
  p { margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
  th, td { border: 1px solid #cbd5f5; padding: 8px; text-align: left; }
  th { background: #eef2ff; font-weight: 600; }
  .print-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
  .print-meta { text-align: right; font-size: 12px; color: #475569; }
`;

const openPrintWindow = (title: string, contentHtml: string) => {
  if (typeof window === 'undefined' || !contentHtml.trim()) return;
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) return;
  const generatedAt = new Date().toLocaleString('pt-BR');
  win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${PRINT_STYLES}</style></head><body>`);
  win.document.write(`
    <div class="print-header">
      <div>
        <h1>Seminário Presbiteriano de Jesus</h1>
        <p>Sistema de Gestão Acadêmica</p>
        <p><strong>Relatório:</strong> ${escapeHtml(title)}</p>
      </div>
      <div class="print-meta">
        <p>Gerado em ${generatedAt}</p>
      </div>
    </div>
  `);
  win.document.write(contentHtml);
  win.document.write('</body></html>');
  win.document.close();
  win.focus();
  win.print();
};

const slugifyForFile = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'relatorio';

const exportRowsToXLSX = (sheetName: string, rows: Record<string, unknown>[], baseName: string) => {
  if (!rows.length) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  const timestamp = new Date().toISOString().slice(0, 10);
  const safeBase = slugifyForFile(baseName);
  XLSX.writeFile(workbook, `${safeBase || 'relatorio'}-${timestamp}.xlsx`);
};

const fetchAllAlunos = async (filters?: { coorteId?: number | null }): Promise<Aluno[]> => {
  const limit = 200;
  let page = 1;
  const aggregated: Aluno[] = [];
  while (true) {
    const response = await apiService.getAlunos({
      page,
      limit,
      sortBy: 'nome',
      sortOrder: 'asc',
      coorteId: filters?.coorteId ?? undefined,
    });
    const rawBatch = response.data ?? [];
    console.log('[Relatorios] fetchAllAlunos batch', {
      page,
      limit,
      filters,
      rawSize: rawBatch.length,
      sampleRaw: rawBatch[0],
    });
    const batch = rawBatch.map(mapAlunoRecord);
    console.log('[Relatorios] fetchAllAlunos mapped batch', {
      page,
      mappedSize: batch.length,
      sampleMapped: batch[0],
    });
    aggregated.push(...batch);
    const pagination = response.pagination;
    const reachedEnd = pagination?.totalPages
      ? page >= pagination.totalPages
      : batch.length < limit;
    if (reachedEnd || batch.length === 0) break;
    page += 1;
  }
  console.log('[Relatorios] fetchAllAlunos aggregated', {
    filters,
    total: aggregated.length,
  });
  return aggregated;
};

type ReportTab = 'historico' | 'frequencia' | 'desempenho';

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('historico');
  const [alunoId, setAlunoId] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cursoFilter, setCursoFilter] = useState('');
  const [coorteFilter, setCoorteFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');

  const [historico, setHistorico] = useState<HistoricoReportItem[] | null>(null);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoError, setHistoricoError] = useState<string | null>(null);

  const [freq, setFreq] = useState<FrequenciaReportResponse | null>(null);
  const [freqLoading, setFreqLoading] = useState(false);
  const [freqError, setFreqError] = useState<string | null>(null);

  const [desempenho, setDesempenho] = useState<DesempenhoReport | null>(null);
  const [desempenhoLoading, setDesempenhoLoading] = useState(false);
  const [desempenhoError, setDesempenhoError] = useState<string | null>(null);

  const { data: turmasData, isLoading: turmasLoading } = useQuery({
    queryKey: ['relatorios', 'turmas'],
    queryFn: () => apiService.getTurmas({ limit: 200, sortBy: 'id', sortOrder: 'desc' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: disciplinasData, isLoading: disciplinasLoading } = useQuery({
    queryKey: ['relatorios', 'disciplinas'],
    queryFn: () => apiService.getDisciplinas({ limit: 200, sortBy: 'nome', sortOrder: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });

  const normalizeFilterValue = (value: string) => (value && value.trim() !== '' ? value.trim() : null);
  const cursoFilterId = normalizeFilterValue(cursoFilter);
  const coorteFilterId = normalizeFilterValue(coorteFilter);
  const periodoFilterId = normalizeFilterValue(periodoFilter);

  const coorteFilterNumericId = coorteFilterId && !Number.isNaN(Number(coorteFilterId)) ? Number(coorteFilterId) : null;
  const cursoFilterNumericId = cursoFilterId && !Number.isNaN(Number(cursoFilterId)) ? Number(cursoFilterId) : null;

  const { data: alunosData = [], isLoading: alunosLoading } = useQuery<Aluno[]>({
    queryKey: ['relatorios', 'alunos', 'all', { coorte: coorteFilterNumericId }],
    queryFn: () => fetchAllAlunos({ coorteId: coorteFilterNumericId }),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData ?? [],
  });

  const { data: cursosResponse, isLoading: cursosLoading } = useQuery<{ data: Curso[]; pagination?: any }>({
    queryKey: ['relatorios', 'filters', 'cursos'],
    queryFn: () => apiService.getCursos({ limit: 200, sortBy: 'nome', sortOrder: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: coortesData, isLoading: coortesLoading } = useQuery<Coorte[]>({
    queryKey: ['relatorios', 'filters', 'coortes', cursoFilterNumericId],
    queryFn: () => {
      if (cursoFilterNumericId === null) return Promise.resolve([] as Coorte[]);
      return apiService.getCoortes({ cursoId: cursoFilterNumericId });
    },
    enabled: cursoFilterNumericId !== null,
    staleTime: 5 * 60 * 1000,
  });

  const { data: periodosResponse, isLoading: periodosLoading } = useQuery<{ data: Periodo[]; pagination?: any }>({
    queryKey: ['relatorios', 'filters', 'periodos', cursoFilterNumericId],
    queryFn: () => {
      if (cursoFilterNumericId === null) return Promise.resolve({ data: [] as Periodo[] });
      return apiService.getPeriodos({ cursoId: cursoFilterNumericId, limit: 200 });
    },
    enabled: cursoFilterNumericId !== null,
    staleTime: 5 * 60 * 1000,
  });

  const cursosList = cursosResponse?.data ?? [];
  const coortesList = coortesData ?? [];
  const periodosList = periodosResponse?.data ?? [];

  const filteredAlunos = useMemo(
    () =>
      alunosData.filter((aluno) => {
        const alunoCursoId = getAlunoCursoId(aluno);
        if (cursoFilterId !== null && alunoCursoId !== cursoFilterId) return false;
        const alunoCoorteId = getAlunoCoorteId(aluno);
        if (coorteFilterId !== null && alunoCoorteId !== null && alunoCoorteId !== coorteFilterId) return false;
        const alunoPeriodoId = getAlunoPeriodoId(aluno);
        if (periodoFilterId !== null && alunoPeriodoId !== periodoFilterId) return false;
        return true;
      }),
    [alunosData, coorteFilterId, cursoFilterId, periodoFilterId],
  );

  useEffect(() => {
    console.log('[Relatorios] filter snapshot', {
      cursoFilterId,
      coorteFilterId,
      periodoFilterId,
      totalAlunos: alunosData.length,
    });
  }, [alunosData.length, cursoFilterId, coorteFilterId, periodoFilterId]);

  useEffect(() => {
    console.log('[Relatorios] filtered alunos result', {
      total: filteredAlunos.length,
      sample: filteredAlunos[0],
    });
  }, [filteredAlunos]);

  const cursoFilterOptions = useMemo(
    () =>
      cursosList
        .map((curso) => ({ value: String(curso.id), label: curso.nome || `Curso #${curso.id}` }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })),
    [cursosList],
  );

  const coorteFilterOptions = useMemo(
    () =>
      coortesList
        .map((coorte) => {
          const base = coorte.rotulo?.trim() || `Coorte #${coorte.id}`;
          const suffix = coorte.anoIngresso ? ` · ${coorte.anoIngresso}` : '';
          return { value: String(coorte.id), label: `${base}${suffix}` };
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })),
    [coortesList],
  );
  const allowedPeriodoIds = useMemo(() => {
    if (coorteFilterId === null) return null;
    const ids = new Set<string>();
    alunosData.forEach((aluno) => {
      if (getAlunoCoorteId(aluno) === coorteFilterId) {
        const alunoPeriodoId = getAlunoPeriodoId(aluno);
        if (alunoPeriodoId !== null) ids.add(alunoPeriodoId);
      }
    });
    return ids.size > 0 ? ids : null;
  }, [alunosData, coorteFilterId]);

  const periodoFilterOptions = useMemo(
    () =>
      periodosList
        .filter((periodo) => {
          if (!allowedPeriodoIds) return true;
          const periodoId = normalizeIdValue(periodo.id);
          return periodoId ? allowedPeriodoIds.has(periodoId) : false;
        })
        .map((periodo) => {
          const numero = typeof periodo.numero === 'number' ? periodo.numero : null;
          const name = periodo.nome?.trim();
          const label = name || (numero !== null ? `Período ${numero}` : `Período #${periodo.id}`);
          return { value: String(periodo.id), label };
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })),
    [allowedPeriodoIds, periodosList],
  );

  const alunoOptions = useMemo(
    () =>
      filteredAlunos.map((aluno) => {
        const nome = aluno.pessoa?.nome ?? aluno.pessoa?.nomeCompleto ?? aluno.ra;
        return { value: aluno.ra, label: `${nome} (${aluno.ra})` };
      }),
    [filteredAlunos],
  );

  useEffect(() => {
    setCoorteFilter('');
    setPeriodoFilter('');
  }, [cursoFilter]);

  useEffect(() => {
    setPeriodoFilter('');
  }, [coorteFilter]);

  useEffect(() => {
    if (alunoId && !filteredAlunos.some((aluno) => aluno.ra === alunoId)) {
      setAlunoId('');
    }
  }, [alunoId, filteredAlunos]);

  const turmaOptions = useMemo(
    () =>
      (turmasData?.data ?? []).map((turma) => {
        const disciplinaLabel = turma.disciplina?.nome ?? `Disciplina #${turma.disciplinaId}`;
        const secao = turma.secao ? ` · ${turma.secao}` : '';
        return { value: String(turma.id), label: `${disciplinaLabel} · Turma ${turma.id}${secao}` };
      }),
    [turmasData],
  );

  const disciplinaOptions = useMemo(
    () =>
      (disciplinasData?.data ?? []).map((disciplina) => {
        const codigo = disciplina.codigo ? `${disciplina.codigo} — ` : '';
        return { value: String(disciplina.id), label: `${codigo}${disciplina.nome}` };
      }),
    [disciplinasData],
  );

  const selectedAlunoLabel = useMemo(
    () => alunoOptions.find((option) => option.value === alunoId)?.label ?? null,
    [alunoOptions, alunoId],
  );

  const selectedTurmaLabel = useMemo(
    () => turmaOptions.find((option) => option.value === turmaId)?.label ?? null,
    [turmaOptions, turmaId],
  );

  const selectedDisciplinaLabel = useMemo(
    () => disciplinaOptions.find((option) => option.value === disciplinaId)?.label ?? null,
    [disciplinaOptions, disciplinaId],
  );

  const historicoColumns = useMemo(() => {
    if (!historico) return [] as string[];
    const labels = new Map<string, true>();
    historico.forEach((item) => {
      item.notas?.forEach((nota) => {
        const label = getNotaLabel(nota);
        if (!labels.has(label)) labels.set(label, true);
      });
    });
    return Array.from(labels.keys());
  }, [historico]);

  const historicoHasData = (historico?.length ?? 0) > 0;
  const freqHasData = (freq?.data?.length ?? 0) > 0;
  const desempenhoHasData = !!desempenho && desempenho.turmas > 0;

  const getStatValue = (loading: boolean, total: number) => {
    if (loading) return '...';
    return total > 0 ? total.toString() : '0';
  };

  const lastReportCount = useMemo(() => {
    if (activeTab === 'historico') return historico?.length ?? 0;
    if (activeTab === 'frequencia') return freq?.data?.length ?? 0;
    if (activeTab === 'desempenho') return desempenho?.alunos ?? 0;
    return 0;
  }, [activeTab, desempenho, freq, historico]);

  const lastReportLabel = useMemo(() => {
    if (activeTab === 'historico') return 'Linhas do histórico atual';
    if (activeTab === 'frequencia') return 'Alunos na última frequência';
    return 'Alunos impactados';
  }, [activeTab]);

  const heroStats = useMemo(
    () => [
      { value: getStatValue(alunosLoading, alunosData.length), label: 'Alunos indexados' },
      { value: getStatValue(turmasLoading, turmasData?.data?.length ?? 0), label: 'Turmas monitoradas' },
      { value: getStatValue(disciplinasLoading, disciplinasData?.data?.length ?? 0), label: 'Disciplinas catalogadas' },
      { value: lastReportCount > 0 ? lastReportCount.toString() : '0', label: lastReportLabel },
    ],
    [
      alunosData.length,
      alunosLoading,
      disciplinasData?.data?.length,
      disciplinasLoading,
      lastReportCount,
      lastReportLabel,
      turmasData?.data?.length,
      turmasLoading,
    ],
  );

  usePageHero({
    title: 'Análise e relatórios do sistema',
    description: 'Gere relatórios detalhados sobre histórico acadêmico, frequência e desempenho dos alunos.',
    backTo: '/dashboard',
    stats: heroStats,
    actionLink: {
      href: '/dashboard',
      label: 'Ver dashboard',
    },
  });

  const fetchHistorico = useCallback(
    async (targetAlunoId: string) => {
      if (!targetAlunoId) {
        setHistorico(null);
        setHistoricoError(null);
        return;
      }
      setHistoricoError(null);
      setHistoricoLoading(true);
      try {
        const data = await apiService.reportHistorico(targetAlunoId);
        setHistorico(data);
      } catch (error) {
        console.error('Erro ao gerar histórico', error);
        setHistoricoError('Não foi possível gerar o histórico. Tente novamente.');
      } finally {
        setHistoricoLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!alunoId) {
      setHistorico(null);
      setHistoricoError(null);
      return;
    }
    fetchHistorico(alunoId);
  }, [alunoId, fetchHistorico]);

  const handleGenerateFrequencia = async () => {
    if (!turmaId) {
      setFreq(null);
      setFreqError('Selecione uma turma para gerar o relatório.');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setFreqError('A data inicial deve ser anterior à data final.');
      return;
    }
    setFreqError(null);
    setFreqLoading(true);
    try {
      const turmaNumber = Number(turmaId);
      if (Number.isNaN(turmaNumber)) throw new Error('Turma inválida');
      const data = await apiService.reportFrequencia(turmaNumber, startDate || undefined, endDate || undefined);
      setFreq(data);
    } catch (error) {
      console.error('Erro ao gerar frequência', error);
      setFreqError('Não foi possível gerar o relatório de frequência.');
    } finally {
      setFreqLoading(false);
    }
  };

  const handleGenerateDesempenho = async () => {
    if (!disciplinaId) {
      setDesempenho(null);
      setDesempenhoError('Selecione uma disciplina para gerar os indicadores.');
      return;
    }
    setDesempenhoError(null);
    setDesempenhoLoading(true);
    try {
      const data = await apiService.reportDesempenho(Number(disciplinaId));
      setDesempenho(data);
    } catch (error) {
      console.error('Erro ao gerar desempenho', error);
      setDesempenhoError('Não foi possível gerar o painel de desempenho.');
    } finally {
      setDesempenhoLoading(false);
    }
  };

  const buildHistoricoExportRows = useCallback(() => {
    if (!historicoHasData || !historico) return [] as Record<string, unknown>[];
    return historico.map((item) => {
      const row: Record<string, unknown> = {
        Disciplina: item.disciplinaNome ?? `Disciplina #${item.disciplinaId}`,
        Turma: item.turmaId,
      };
      historicoColumns.forEach((column) => {
        const nota = item.notas?.find((n) => getNotaLabel(n) === column);
        row[column] = nota?.nota ?? null;
      });
      row['Frequência (%)'] = typeof item.frequencia === 'number' ? Number(item.frequencia.toFixed(1)) : null;
      row['Média'] = typeof item.media === 'number' ? Number(Number(item.media).toFixed(1)) : null;
      row['Situação'] = resolveResultado(item);
      return row;
    });
  }, [historico, historicoColumns, historicoHasData]);

  const buildFrequenciaExportRows = useCallback(() => {
    if (!freqHasData || !freq) return [] as Record<string, unknown>[];
    return freq.data.map((row) => ({
      RA: row.ra,
      Nome: row.nome ?? 'Aluno sem nome',
      Presenças: row.presencas,
      'Total de aulas': row.totalAulas,
      'Frequência (%)': typeof row.frequencia === 'number' ? Number(row.frequencia.toFixed(1)) : null,
    }));
  }, [freq, freqHasData]);

  const buildDesempenhoExportRows = useCallback(() => {
    if (!desempenho) return [] as Record<string, unknown>[];
    return [
      { Métrica: 'Turmas analisadas', Valor: desempenho.turmas },
      { Métrica: 'Alunos impactados', Valor: desempenho.alunos },
      { Métrica: 'Média geral', Valor: desempenho.mediaGeral !== null ? Number(desempenho.mediaGeral.toFixed(1)) : null },
    ];
  }, [desempenho]);

  const buildHistoricoPrintContent = useCallback(() => {
    if (!historicoHasData || !historico) return '';
    const alunoLabel = selectedAlunoLabel ?? alunoId;
    const header = `<p><strong>Aluno:</strong> ${escapeHtml(alunoLabel || 'Não informado')}</p>`;
    const evaluationColumns = historicoColumns.length ? historicoColumns : [];
    const tableHead = [
      '<th>Disciplina</th>',
      ...evaluationColumns.map((column) => `<th>${escapeHtml(column)}</th>`),
      '<th>Frequência</th>',
      '<th>Média</th>',
      '<th>Resultado</th>',
    ].join('');

    const tableRows = historico
      .map((item) => {
        const disciplinaNome = item.disciplinaNome ?? `Disciplina #${item.disciplinaId}`;
        const avaliacoes = evaluationColumns
          .map((column) => {
            const nota = item.notas?.find((n) => getNotaLabel(n) === column);
            return `<td>${nota?.nota !== undefined && nota?.nota !== null ? formatDecimal(nota.nota) : '-'}</td>`;
          })
          .join('');
        const resultado = resolveResultado(item);
        return `
          <tr>
            <td>
              <strong>${escapeHtml(disciplinaNome)}</strong><br />
              <small>Turma #${item.turmaId}</small>
            </td>
            ${avaliacoes}
            <td>${formatPercent(item.frequencia)}</td>
            <td>${formatDecimal(item.media)}</td>
            <td>${resultado}</td>
          </tr>
        `;
      })
      .join('');

    return `${header}<table><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table>`;
  }, [alunoId, historico, historicoColumns, historicoHasData, selectedAlunoLabel]);

  const buildFrequenciaPrintContent = useCallback(() => {
    if (!freqHasData || !freq) return '';
    const turmaLabel = selectedTurmaLabel ?? turmaId;
    const periodInfo = startDate || endDate ? `
      <p><strong>Período:</strong> ${startDate || 'início não definido'} até ${endDate || 'fim não definido'}</p>
    ` : '';
    const rows = freq.data
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.ra)}</td>
            <td>${escapeHtml(row.nome ?? 'Aluno sem nome cadastrado')}</td>
            <td>${row.presencas}</td>
            <td>${row.totalAulas}</td>
            <td>${formatPercent(row.frequencia)}</td>
          </tr>
        `,
      )
      .join('');
    const metaInfo = freq.meta?.totalAulas !== undefined
      ? `<p><strong>Total de aulas consideradas:</strong> ${freq.meta.totalAulas}</p>`
      : '';
    return `
      <p><strong>Turma:</strong> ${escapeHtml(turmaLabel || 'Não informada')}</p>
      ${periodInfo}
      <table>
        <thead>
          <tr>
            <th>RA</th>
            <th>Nome</th>
            <th>Presenças</th>
            <th>Total</th>
            <th>Frequência</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${metaInfo}
    `;
  }, [endDate, freq, freqHasData, selectedTurmaLabel, startDate, turmaId]);

  const buildDesempenhoPrintContent = useCallback(() => {
    if (!desempenho || (!desempenhoHasData && desempenho.mediaGeral === null)) return '';
    const disciplinaLabel = selectedDisciplinaLabel ?? disciplinaId;
    return `
      <p><strong>Disciplina:</strong> ${escapeHtml(disciplinaLabel || 'Não informada')}</p>
      <table>
        <thead>
          <tr>
            <th>Métrica</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Turmas analisadas</td><td>${desempenho.turmas}</td></tr>
          <tr><td>Alunos impactados</td><td>${desempenho.alunos}</td></tr>
          <tr><td>Média geral</td><td>${
            desempenho.mediaGeral !== null ? formatDecimal(desempenho.mediaGeral) : '-'
          }</td></tr>
        </tbody>
      </table>
    `;
  }, [desempenho, desempenhoHasData, disciplinaId, selectedDisciplinaLabel]);

  const handleExport = useCallback(
    (tab: ReportTab) => {
      if (tab === 'historico') {
        const rows = buildHistoricoExportRows();
        if (rows.length === 0) return;
        const alunoLabel = (selectedAlunoLabel ?? alunoId) || 'historico';
        exportRowsToXLSX('Historico', rows, `historico-${alunoLabel}`);
        return;
      }
      if (tab === 'frequencia') {
        const rows = buildFrequenciaExportRows();
        if (rows.length === 0) return;
        const turmaLabel = (selectedTurmaLabel ?? turmaId) || 'turma';
        exportRowsToXLSX('Frequencia', rows, `frequencia-${turmaLabel}`);
        return;
      }
      const rows = buildDesempenhoExportRows();
      if (rows.length === 0) return;
      const disciplinaLabel = (selectedDisciplinaLabel ?? disciplinaId) || 'disciplina';
      exportRowsToXLSX('Desempenho', rows, `desempenho-${disciplinaLabel}`);
    },
    [
      alunoId,
      buildDesempenhoExportRows,
      buildFrequenciaExportRows,
      buildHistoricoExportRows,
      disciplinaId,
      selectedAlunoLabel,
      selectedDisciplinaLabel,
      selectedTurmaLabel,
      turmaId,
    ],
  );

  const handlePrint = useCallback(
    (tab: ReportTab) => {
      if (tab === 'historico') {
        const content = buildHistoricoPrintContent();
        if (content) openPrintWindow('Relatório de Histórico Acadêmico', content);
        return;
      }
      if (tab === 'frequencia') {
        const content = buildFrequenciaPrintContent();
        if (content) openPrintWindow('Relatório de Frequência por Turma', content);
        return;
      }
      const content = buildDesempenhoPrintContent();
      if (content) openPrintWindow('Indicadores de Desempenho por Disciplina', content);
    },
    [buildDesempenhoPrintContent, buildFrequenciaPrintContent, buildHistoricoPrintContent],
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Alunos cadastrados" value={getStatValue(alunosLoading, alunosData.length)} icon={CheckCircle} iconColor="text-green-600" />
          <StatCard title="Turmas disponíveis" value={getStatValue(turmasLoading, turmaOptions.length)} icon={BarChart3} iconColor="text-purple-600" />
          <StatCard title="Disciplinas" value={getStatValue(disciplinasLoading, disciplinaOptions.length)} icon={FileText} iconColor="text-blue-600" />
          <StatCard title="Relatórios ativos" value="3" icon={TrendingUp} iconColor="text-orange-500" />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportTab)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="historico">Histórico acadêmico</TabsTrigger>
            <TabsTrigger value="frequencia">Frequência</TabsTrigger>
            <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
          </TabsList>

          <TabsContent value="historico">
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Histórico Acadêmico</CardTitle>
                  <CardDescription>
                    Uma linha por disciplina, colunas por avaliações e consolidados oficiais. Ajuste os filtros, selecione o aluno e o relatório aparece automaticamente.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Passo 1 · Filtros opcionais</p>
                      <p className="text-sm text-slate-600">Use estes filtros para reduzir a lista de alunos antes de escolher quem irá analisar.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Curso</label>
                        <SearchSelect
                          value={cursoFilter}
                          onChange={setCursoFilter}
                          options={cursoFilterOptions}
                          placeholder="Todos os cursos"
                          emptyMessage="Nenhum curso cadastrado"
                          isLoading={cursosLoading}
                          disabled={cursosLoading || cursoFilterOptions.length === 0}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Coorte</label>
                        <SearchSelect
                          value={coorteFilter}
                          onChange={setCoorteFilter}
                          options={coorteFilterOptions}
                          placeholder={cursoFilterId ? 'Todos os coortes' : 'Selecione um curso primeiro'}
                          emptyMessage={cursoFilterId ? 'Nenhum coorte disponível' : 'Selecione um curso primeiro'}
                          isLoading={coortesLoading}
                          disabled={!cursoFilterId || coortesLoading}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Período</label>
                        <SearchSelect
                          value={periodoFilter}
                          onChange={setPeriodoFilter}
                          options={periodoFilterOptions}
                          placeholder={cursoFilterId ? 'Todos os períodos' : 'Selecione um curso primeiro'}
                          emptyMessage={cursoFilterId ? 'Nenhum período disponível' : 'Selecione um curso primeiro'}
                          isLoading={periodosLoading}
                          disabled={!cursoFilterId || periodosLoading}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Passo 2 · Escolha o aluno</p>
                      <p className="text-sm text-slate-700">Assim que você selecionar, o histórico será carregado automaticamente.</p>
                    </div>
                    <SearchSelect
                      value={alunoId}
                      onChange={setAlunoId}
                      options={alunoOptions}
                      placeholder="Selecione um aluno"
                      emptyMessage="Nenhum aluno encontrado"
                      isLoading={alunosLoading}
                      disabled={alunosLoading || alunoOptions.length === 0}
                    />
                    <p className="text-xs text-slate-600">Dica: ajuste o curso/coorte antes de selecionar para facilitar a busca.</p>
                  </div>
                </div>
                {!alunoId && (
                  <p className="text-sm text-slate-500">Selecione um aluno para visualizar o histórico consolidado.</p>
                )}
                {historicoError && <p className="text-sm text-red-600">{historicoError}</p>}
                {historicoLoading && alunoId && !historicoError && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando histórico acadêmico...
                  </div>
                )}
                {historico && !historicoHasData && !historicoLoading && alunoId && !historicoError && (
                  <p className="text-sm text-slate-500">Nenhum lançamento encontrado para o aluno selecionado.</p>
                )}
                {historicoHasData && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Histórico consolidado</p>
                        <p className="text-xs text-slate-500">
                          {selectedAlunoLabel ? `Aluno selecionado: ${selectedAlunoLabel}` : 'Aluno não identificado'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fetchHistorico(alunoId)}
                          disabled={!alunoId || historicoLoading}
                        >
                          {historicoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          Atualizar dados
                        </Button>
                        <Button
                          size="sm"
                          disabled={!historicoHasData}
                          onClick={() => handleExport('historico')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exportar XLSX
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!historicoHasData}
                          onClick={() => handlePrint('historico')}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">Disciplina</th>
                            {historicoColumns.map((column) => (
                              <th key={column} className="px-4 py-2 text-center font-medium text-slate-600">
                                {column}
                              </th>
                            ))}
                            <th className="px-4 py-2 text-center font-medium text-slate-600">Frequência</th>
                            <th className="px-4 py-2 text-center font-medium text-slate-600">Média</th>
                            <th className="px-4 py-2 text-center font-medium text-slate-600">Situação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {historico?.map((item) => {
                            const resultado = resolveResultado(item);
                            const variant =
                              resultado === 'APROVADO'
                                ? 'secondary'
                                : resultado === 'REPROVADO'
                                  ? 'destructive'
                                  : 'outline';
                            return (
                              <tr key={`${item.inscricaoId}-${item.turmaId}`}>
                                <td className="px-4 py-3 align-top">
                                  <div className="font-medium text-slate-900">{item.disciplinaNome ?? `Disciplina #${item.disciplinaId}`}</div>
                                  <div className="text-xs text-slate-500">Turma #{item.turmaId}</div>
                                </td>
                                {historicoColumns.map((column) => {
                                  const nota = item.notas?.find((n) => getNotaLabel(n) === column);
                                  return (
                                    <td key={`${item.inscricaoId}-${column}`} className="px-4 py-3 text-center">
                                      {nota && nota.nota !== undefined && nota.nota !== null ? formatDecimal(nota.nota) : '-'}
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-3 text-center">{formatPercent(item.frequencia)}</td>
                                <td className="px-4 py-3 text-center">{formatDecimal(item.media)}</td>
                                <td className="px-4 py-3 text-center">
                                  <Badge variant={variant as any} className="text-xs uppercase">
                                    {resultado}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {historicoColumns.length === 0 && (
                      <p className="text-xs text-slate-500">Nenhuma avaliação lançada até o momento.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frequencia">
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Frequência por Turma</CardTitle>
                  <CardDescription>Presença consolidada com intervalo opcional de datas.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!freqHasData}
                    onClick={() => handleExport('frequencia')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar XLSX
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!freqHasData}
                    onClick={() => handlePrint('frequencia')}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-5">
                  <div className="lg:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Turma</label>
                    <SearchSelect
                      value={turmaId}
                      onChange={setTurmaId}
                      options={turmaOptions}
                      placeholder="Selecione uma turma"
                      emptyMessage="Nenhuma turma encontrada"
                      isLoading={turmasLoading}
                      disabled={turmasLoading || turmaOptions.length === 0}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Período inicial</label>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Período final</label>
                    <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleGenerateFrequencia} disabled={!turmaId || freqLoading} className="w-full lg:w-auto">
                      {freqLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                      {freqLoading ? 'Gerando...' : 'Gerar relatório'}
                    </Button>
                  </div>
                </div>
                {freqError && <p className="text-sm text-red-600">{freqError}</p>}
                {freqLoading && !freqError && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Consolidando presença...
                  </div>
                )}
                {freq && !freqHasData && !freqLoading && !freqError && (
                  <p className="text-sm text-slate-500">Nenhum registro de frequência no recorte informado.</p>
                )}
                {freqHasData && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">RA</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">Nome</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">Presenças</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">Total</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">Frequência</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {freq?.data.map((row) => (
                            <tr key={row.alunoId}>
                              <td className="px-4 py-2 font-medium text-slate-900">{row.ra}</td>
                              <td className="px-4 py-2 text-slate-700">{row.nome || 'Aluno sem nome cadastrado'}</td>
                              <td className="px-4 py-2">{row.presencas}</td>
                              <td className="px-4 py-2">{row.totalAulas}</td>
                              <td className="px-4 py-2">
                                <Badge variant={row.frequencia >= 75 ? 'secondary' : 'destructive'} className="text-xs">
                                  {formatPercent(row.frequencia)}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {freq?.meta?.totalAulas !== undefined && (
                      <p className="text-xs text-slate-500">
                        Total de aulas consideradas: <span className="font-semibold text-slate-700">{freq.meta.totalAulas}</span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="desempenho">
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Desempenho por Disciplina</CardTitle>
                  <CardDescription>Resumo de turmas, alunos impactados e média geral.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!desempenho}
                    onClick={() => handleExport('desempenho')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar XLSX
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!desempenho}
                    onClick={() => handlePrint('desempenho')}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_auto]">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Disciplina</label>
                    <SearchSelect
                      value={disciplinaId}
                      onChange={setDisciplinaId}
                      options={disciplinaOptions}
                      placeholder="Selecione uma disciplina"
                      emptyMessage="Nenhuma disciplina encontrada"
                      isLoading={disciplinasLoading}
                      disabled={disciplinasLoading || disciplinaOptions.length === 0}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleGenerateDesempenho} disabled={!disciplinaId || desempenhoLoading} className="w-full md:w-auto">
                      {desempenhoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                      {desempenhoLoading ? 'Gerando...' : 'Gerar indicadores'}
                    </Button>
                  </div>
                </div>
                {desempenhoError && <p className="text-sm text-red-600">{desempenhoError}</p>}
                {desempenhoLoading && !desempenhoError && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculando indicadores...
                  </div>
                )}
                {desempenho && !desempenhoLoading && !desempenhoError && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-100 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Turmas analisadas</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{desempenho.turmas}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-100 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Alunos impactados</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{desempenho.alunos}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-100 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Média geral</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{desempenho.mediaGeral !== null ? formatDecimal(desempenho.mediaGeral) : '-'} / 10</p>
                    </div>
                  </div>
                )}
                {desempenho && desempenho.turmas === 0 && !desempenhoLoading && !desempenhoError && (
                  <p className="text-sm text-slate-500">Ainda não há turmas vinculadas a esta disciplina.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
