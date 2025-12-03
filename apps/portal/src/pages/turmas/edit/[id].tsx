import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, MapPin, FileText, Calendar, GraduationCap } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { TimeInput } from '@/components/ui/time-input';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { DatePicker } from '@/components/ui/date-picker';
import { apiService } from '@/services/api';
import { CreateTurma } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import CrudHeader from '@/components/crud/crud-header';
import { FormSection, ActionsBar } from '@/components/forms';
import { cn } from '@/lib/utils';

const buildHorarioOptionValue = (horario: any, index: number) =>
  horario?.id || `${horario?.horaInicio}-${horario?.horaFim}-${index}`;

const formatHorario = (value?: string | null) => (value ? value.slice(0, 5) : '');

const OVERRIDE_KEYS = [
  'ementa',
  'bibliografia',
  'objetivos',
  'conteudoProgramatico',
  'instrumentosEAvaliacao',
] as const;

type OverrideKey = (typeof OVERRIDE_KEYS)[number];
type OverrideFieldsState = Partial<Record<OverrideKey, string | null>>;

const FIELD_LABELS: Record<OverrideKey, string> = {
  ementa: 'Ementa',
  bibliografia: 'Bibliografia',
  objetivos: 'Objetivos',
  conteudoProgramatico: 'Conteúdo Programático',
  instrumentosEAvaliacao: 'Instrumentos e Critérios de Avaliação',
};

export default function TurmaEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedCursoId, setSelectedCursoId] = React.useState<number | ''>('');
  const [selectedDisciplinaId, setSelectedDisciplinaId] = React.useState<number | ''>('');
  const [selectedCoorteId, setSelectedCoorteId] = React.useState<number | ''>('');
  const [diaSemana, setDiaSemana] = React.useState<string>('');
  const [horarioInicio, setHorarioInicio] = React.useState<string>('');
  const [horarioFim, setHorarioFim] = React.useState<string>('');
  const [selectedPeriodoId, setSelectedPeriodoId] = React.useState<number | ''>('');
  const [selectedTurnoHorarioId, setSelectedTurnoHorarioId] = React.useState<string>('');
  const [useCustomHorario, setUseCustomHorario] = React.useState(true);
  const [horarioModeManuallySet, setHorarioModeManuallySet] = React.useState(false);
  const [shouldAutoSelectPeriodo, setShouldAutoSelectPeriodo] = React.useState(false);
  const previousPeriodoRef = React.useRef<number | ''>('');
  const [dataInicio, setDataInicio] = React.useState<string | null>(null);
  const [dataFim, setDataFim] = React.useState<string | null>(null);
  const [overrideFields, setOverrideFields] = React.useState<OverrideFieldsState>({});
  // Referência para rastrear se os dados iniciais já foram carregados
  const initialDataLoadedRef = React.useRef(false);
  // Referência para rastrear o cursoId original da turma
  const originalCursoIdRef = React.useRef<number | ''>('');

  const { data: turma, isLoading } = useQuery({
    queryKey: ['turma', id],
    queryFn: () => apiService.getTurma(Number(id)),
    enabled: Boolean(id),
  });

  React.useEffect(() => {
    if (!turma) return;
    // Marca que os dados iniciais foram carregados
    initialDataLoadedRef.current = true;
    const turmaOriginalCursoId = typeof turma.disciplina?.cursoId === 'number' ? turma.disciplina.cursoId : '';
    originalCursoIdRef.current = turmaOriginalCursoId;
    setSelectedCursoId(turmaOriginalCursoId);
    setSelectedDisciplinaId(turma.disciplinaId ?? '');
    setSelectedCoorteId(turma.coorteId ?? '');
    setDiaSemana(turma.diaSemana !== undefined && turma.diaSemana !== null ? String(turma.diaSemana) : '');
    // Normaliza horários para formato HH:mm (remove segundos se existirem)
    const normalizeTime = (time: string | null | undefined): string => {
      if (!time) return '';
      // Remove segundos se existirem (formato HH:mm:ss -> HH:mm)
      return time.substring(0, 5);
    };
    setHorarioInicio(normalizeTime(turma.horarioInicio));
    setHorarioFim(normalizeTime(turma.horarioFim));
    setDataInicio(turma.dataInicio || null);
    setDataFim(turma.dataFim || null);
    setSelectedPeriodoId(turma.periodoId ?? '');
    setOverrideFields({
      ementa: turma.ementa ?? null,
      bibliografia: turma.bibliografia ?? null,
      objetivos: turma.objetivos ?? null,
      conteudoProgramatico: turma.conteudoProgramatico ?? null,
      instrumentosEAvaliacao: turma.instrumentosEAvaliacao ?? null,
    });
    setShouldAutoSelectPeriodo(false);
  }, [turma]);

  // Efeito para limpar campos relacionados apenas quando o usuário MUDA o curso
  // (não na carga inicial)
  React.useEffect(() => {
    // Ignora se os dados iniciais ainda não foram carregados
    if (!initialDataLoadedRef.current) return;
    if (!turma) return;
    // Só limpa se o usuário mudou para um curso diferente do original
    if (selectedCursoId === originalCursoIdRef.current) return;
    // Se o usuário mudou o curso para um diferente do original, limpa os campos relacionados
    setSelectedDisciplinaId('');
    setSelectedCoorteId('');
    setSelectedPeriodoId('');
    setOverrideFields({});
    setShouldAutoSelectPeriodo(false);
  }, [selectedCursoId, turma]);

  const { data: cursosResponse } = useQuery({
    queryKey: ['cursos', 'turmas-form'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data ?? [];

  // Valores efetivos que consideram os dados da turma como fallback antes do useEffect rodar
  const effectiveCursoId = React.useMemo(() => {
    if (selectedCursoId !== '') return selectedCursoId;
    return turma?.disciplina?.cursoId ?? '';
  }, [selectedCursoId, turma?.disciplina?.cursoId]);

  const effectiveDisciplinaId = React.useMemo(() => {
    if (selectedDisciplinaId !== '') return selectedDisciplinaId;
    return turma?.disciplinaId ?? '';
  }, [selectedDisciplinaId, turma?.disciplinaId]);

  const effectivePeriodoId = React.useMemo(() => {
    if (selectedPeriodoId !== '') return selectedPeriodoId;
    return turma?.periodoId ?? '';
  }, [selectedPeriodoId, turma?.periodoId]);

  const { data: disciplinasResponse } = useQuery({
    queryKey: ['disciplinas', effectiveCursoId],
    queryFn: () => apiService.getDisciplinas({ limit: 200, cursoId: Number(effectiveCursoId) }),
    enabled: typeof effectiveCursoId === 'number',
  });
  const disciplinas = disciplinasResponse?.data ?? [];

  const disciplinasOptions = React.useMemo(() => {
    if (!turma?.disciplina) {
      return disciplinas;
    }

    const cursoBase = typeof turma.disciplina.cursoId === 'number' ? turma.disciplina.cursoId : null;
    const shouldKeepFallback =
      effectiveCursoId === '' ||
      (typeof effectiveCursoId === 'number' && cursoBase !== null && effectiveCursoId === cursoBase);

    if (!shouldKeepFallback) {
      return disciplinas;
    }

    const exists = disciplinas.some((disc: any) => disc.id === turma.disciplina!.id);
    if (exists) {
      return disciplinas;
    }
    return [turma.disciplina, ...disciplinas];
  }, [disciplinas, turma, effectiveCursoId]);

  const { data: professoresResponse } = useQuery({
    queryKey: ['professores', 'turmas-form'],
    queryFn: () => apiService.getProfessores({ limit: 200 }),
  });
  const professores = professoresResponse?.data ?? [];

  const { data: coortesResponse } = useQuery({
    queryKey: ['coortes', effectiveCursoId],
    queryFn: () => apiService.getCoortes({ cursoId: Number(effectiveCursoId) }),
    enabled: typeof effectiveCursoId === 'number',
  });
  const coortes = coortesResponse ?? [];

  const { data: turnosResponse } = useQuery({
    queryKey: ['turnos', 'form'],
    queryFn: () => apiService.getTurnos(),
  });
  const turnosMap = React.useMemo(() => {
    const map = new Map<number, any>();
    (turnosResponse ?? []).forEach((turno: any) => {
      if (typeof turno?.id === 'number') {
        map.set(turno.id, turno);
      }
    });
    return map;
  }, [turnosResponse]);
  const turnoNomeMap = React.useMemo(() => {
    const map = new Map<number, string>();
    turnosMap.forEach((turno, id) => {
      if (turno?.nome) {
        map.set(id, turno.nome);
      }
    });
    return map;
  }, [turnosMap]);

  const selectedDisciplina = React.useMemo(
    () => disciplinasOptions.find((d: any) => d.id === Number(effectiveDisciplinaId)),
    [disciplinasOptions, effectiveDisciplinaId],
  );
  const disciplinaParaEdicao = selectedDisciplina ?? turma?.disciplina;

  const periodoInfo = React.useMemo(() => {
    const disciplinaRef = disciplinaParaEdicao;
    if (!disciplinaRef || !Array.isArray(disciplinaRef.periodos) || !disciplinaRef.periodos.length) {
      return 'Selecione uma disciplina para visualizar o período vinculado.';
    }
    const vinculo = disciplinaRef.periodos[0];
    const periodo = vinculo.periodo;
    if (periodo?.nome) return periodo.nome;
    if (periodo?.numero !== undefined) return `Período ${periodo.numero}`;
    return `Período ${vinculo.periodoId}`;
  }, [disciplinaParaEdicao]);

  const periodoOptions = React.useMemo(() => {
    if (!disciplinaParaEdicao || !Array.isArray(disciplinaParaEdicao.periodos)) {
      return [];
    }
    return (
      disciplinaParaEdicao.periodos
        .map((link: any) => {
          const periodoRef = link.periodo;
          const optionId = periodoRef?.id ?? link.periodoId;
          if (!optionId) {
            return null;
          }
          const baseLabel =
            periodoRef?.nome ||
            (periodoRef?.numero !== undefined ? `Período ${periodoRef.numero}` : `Período ${link.periodoId}`);
          const turnoLabel =
            periodoRef?.turnoId && turnoNomeMap.get(periodoRef.turnoId)
              ? ` - ${turnoNomeMap.get(periodoRef.turnoId)}`
              : '';
          return {
            id: optionId,
            label: `${baseLabel}${turnoLabel}`,
          };
        })
        .filter(Boolean) as { id: number; label: string }[]
    );
  }, [disciplinaParaEdicao, turnoNomeMap]);

  const selectedPeriodoLink = React.useMemo(() => {
    if (
      effectivePeriodoId === '' ||
      !disciplinaParaEdicao ||
      !Array.isArray(disciplinaParaEdicao.periodos)
    ) {
      return null;
    }

    return (
      disciplinaParaEdicao.periodos.find(
        (link: any) => (link.periodo?.id ?? link.periodoId) === effectivePeriodoId,
      ) || null
    );
  }, [disciplinaParaEdicao, effectivePeriodoId]);

  const turnoHorarios = React.useMemo(() => {
    const turnoId = selectedPeriodoLink?.periodo?.turnoId;
    if (!turnoId) {
      return [];
    }
    const turno = turnosMap.get(turnoId);
    return Array.isArray(turno?.horarios) ? turno.horarios : [];
  }, [selectedPeriodoLink, turnosMap]);

  React.useEffect(() => {
    if (horarioModeManuallySet) {
      return;
    }
    if (effectivePeriodoId !== '' && turnoHorarios.length > 0) {
      const matchesConfigured = turnoHorarios.some(
        (horario: any) =>
          formatHorario(horario.horaInicio) === horarioInicio &&
          formatHorario(horario.horaFim) === horarioFim,
      );
      setUseCustomHorario(!matchesConfigured);
    } else {
      setUseCustomHorario(true);
    }
  }, [effectivePeriodoId, turnoHorarios, horarioInicio, horarioFim, horarioModeManuallySet]);

  React.useEffect(() => {
    const periodosList = disciplinaParaEdicao?.periodos ?? [];

    if (!shouldAutoSelectPeriodo) {
      setSelectedPeriodoId((prev) => {
        if (prev === '') {
          return '';
        }
        const aindaValido = periodosList.some(
          (item: any) => (item.periodo?.id ?? item.periodoId) === prev,
        );
        return aindaValido ? prev : '';
      });
      return;
    }

    if (periodosList.length === 1) {
      const unicoId = periodosList[0].periodo?.id ?? periodosList[0].periodoId;
      setSelectedPeriodoId(unicoId ?? '');
      setShouldAutoSelectPeriodo(false);
      return;
    }

    setSelectedPeriodoId('');
    setShouldAutoSelectPeriodo(false);
  }, [disciplinaParaEdicao, shouldAutoSelectPeriodo]);

  React.useEffect(() => {
    setHorarioModeManuallySet(false);
  }, [effectivePeriodoId]);

  React.useEffect(() => {
    if (useCustomHorario || turnoHorarios.length === 0) {
      if (selectedTurnoHorarioId !== '') {
        setSelectedTurnoHorarioId('');
      }
      if (turnoHorarios.length === 0) {
        previousPeriodoRef.current = '';
      }
      return;
    }

    let currentIndex = turnoHorarios.findIndex(
      (horario: any, index: number) => buildHorarioOptionValue(horario, index) === selectedTurnoHorarioId,
    );
    if (currentIndex < 0 && horarioInicio && horarioFim) {
      currentIndex = turnoHorarios.findIndex(
        (horario: any) =>
          formatHorario(horario.horaInicio) === horarioInicio && formatHorario(horario.horaFim) === horarioFim,
      );
    }
    const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;
    const current = turnoHorarios[effectiveIndex];
    if (current) {
      const optionValue = buildHorarioOptionValue(current, effectiveIndex);
      if (optionValue !== selectedTurnoHorarioId) {
        setSelectedTurnoHorarioId(optionValue);
      }
      const nextInicio = formatHorario(current.horaInicio);
      const nextFim = formatHorario(current.horaFim);
      if (horarioInicio !== nextInicio) {
        setHorarioInicio(nextInicio);
      }
      if (horarioFim !== nextFim) {
        setHorarioFim(nextFim);
      }
    }
    previousPeriodoRef.current = effectivePeriodoId;
  }, [
    useCustomHorario,
    turnoHorarios,
    selectedTurnoHorarioId,
    effectivePeriodoId,
    horarioInicio,
    horarioFim,
  ]);

  const handleTurnoHorarioSelect = React.useCallback(
    (value: string) => {
      if (useCustomHorario) return;
      setSelectedTurnoHorarioId(value);
      const match = turnoHorarios.find(
        (horario: any, index: number) => buildHorarioOptionValue(horario, index) === value,
      );
      if (match) {
        setHorarioInicio(formatHorario(match.horaInicio));
        setHorarioFim(formatHorario(match.horaFim));
      }
    },
    [turnoHorarios, useCustomHorario],
  );

  const handleHorarioModeToggle = React.useCallback(() => {
    if (turnoHorarios.length === 0) {
      setUseCustomHorario(true);
      setHorarioModeManuallySet(true);
      return;
    }

    if (useCustomHorario) {
      setUseCustomHorario(false);
      setHorarioModeManuallySet(true);
      const defaultHorario = turnoHorarios[0];
      const optionValue = buildHorarioOptionValue(defaultHorario, 0);
      setSelectedTurnoHorarioId(optionValue);
      setHorarioInicio(formatHorario(defaultHorario.horaInicio));
      setHorarioFim(formatHorario(defaultHorario.horaFim));
    } else {
      setUseCustomHorario(true);
      setHorarioModeManuallySet(true);
      setSelectedTurnoHorarioId('');
    }
  }, [turnoHorarios, useCustomHorario]);

  const handleDisciplinaChange = React.useCallback((rawValue: string) => {
    if (!rawValue) {
      setSelectedDisciplinaId('');
      setSelectedPeriodoId('');
      setShouldAutoSelectPeriodo(false);
      return;
    }

    const parsedValue = Number(rawValue);
    setSelectedDisciplinaId(Number.isNaN(parsedValue) ? '' : parsedValue);
    setSelectedPeriodoId('');
    setShouldAutoSelectPeriodo(true);
  }, []);

  const nomeSugestao = React.useMemo(() => {
    if (!disciplinaParaEdicao) return 'Selecione um curso e disciplina';
    const coorte = coortes.find((c: any) => c.id === Number(selectedCoorteId));
    return coorte ? `${disciplinaParaEdicao.nome} — ${coorte.rotulo}` : disciplinaParaEdicao.nome;
  }, [disciplinaParaEdicao, selectedCoorteId, coortes]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreateTurma>) => apiService.updateTurma(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      queryClient.invalidateQueries({ queryKey: ['turma', id] });
      toast({ title: 'Turma atualizada', description: 'Turma atualizada com sucesso!' });
      navigate('/turmas');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao atualizar turma',
        description: error?.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  // Estilos comuns
  const selectClass = "w-full h-11 px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm";

  if (isLoading || !turma) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <CrudHeader
        title="Editar Turma"
        description="Atualize as informações da oferta"
        backTo="/turmas"
      />

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Editar Turma</h1>
            <p className="mt-1 text-sm text-slate-600">Atualize os dados da turma</p>
          </div>

          <div className="px-8 py-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                if (periodoOptions.length > 1 && effectivePeriodoId === '') {
                  toast({
                    title: 'Período obrigatório',
                    description: 'Selecione o período ao qual esta turma estará vinculada.',
                    variant: 'destructive',
                  });
                  return;
                }
                updateMutation.mutate({
                  disciplinaId: Number(fd.get('disciplinaId')),
                  professorId: String(fd.get('professorId') || ''),
                  coorteId: fd.get('coorteId') ? Number(fd.get('coorteId')) : undefined,
                  sala: String(fd.get('sala') || ''),
                  diaSemana: diaSemana ? Number(diaSemana) : undefined,
                  periodoId:
                    effectivePeriodoId === ''
                      ? undefined
                      : Number(effectivePeriodoId),
                  horarioInicio: horarioInicio || undefined,
                  horarioFim: horarioFim || undefined,
                  dataInicio: dataInicio || undefined,
                  dataFim: dataFim || undefined,
                  secao: String(fd.get('secao') || ''),
                  ementa: overrideFields.ementa ?? null,
                  bibliografia: overrideFields.bibliografia ?? null,
                  objetivos: overrideFields.objetivos ?? null,
                  conteudoProgramatico: overrideFields.conteudoProgramatico ?? null,
                  instrumentosEAvaliacao: overrideFields.instrumentosEAvaliacao ?? null,
                });
              }}
              className="space-y-8"
            >
              <FormSection
                icon={BookOpen}
                title="Identificação da Turma"
                description="Selecione a disciplina e o responsável"
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                      <select
                        name="cursoId"
                        value={effectiveCursoId === '' ? '' : String(effectiveCursoId)}
                        onChange={(e) => setSelectedCursoId(e.target.value ? Number(e.target.value) : '')}
                        className={selectClass}
                      >
                        <option value="">Selecione um curso...</option>
                        {cursos.map((curso: any) => (
                          <option key={curso.id} value={String(curso.id)}>
                            {curso.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina *</label>
                      <select
                        name="disciplinaId"
                        value={effectiveDisciplinaId === '' ? '' : String(effectiveDisciplinaId)}
                        onChange={(e) => handleDisciplinaChange(e.target.value)}
                        disabled={typeof effectiveCursoId !== 'number'}
                        className={cn(selectClass, "disabled:opacity-50 disabled:bg-slate-100")}
                      >
                        <option value="">
                          {effectiveCursoId ? 'Selecione uma disciplina...' : 'Escolha um curso primeiro'}
                        </option>
                        {disciplinasOptions.map((d: any) => (
                          <option key={d.id} value={String(d.id)}>
                            {d.codigo} · {d.nome}
                          </option>
                        ))}
                      </select>
                      {selectedDisciplina && (
                        <p className="mt-1.5 text-xs text-blue-600 font-medium flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {periodoInfo}
                        </p>
                      )}
                    </div>
                  </div>

                  {periodoOptions.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Período vinculado {periodoOptions.length > 1 ? '*' : ''}
                      </label>
                      <select
                        value={effectivePeriodoId === '' ? '' : String(effectivePeriodoId)}
                        onChange={(e) =>
                          setSelectedPeriodoId(e.target.value ? Number(e.target.value) : '')
                        }
                        disabled={periodoOptions.length === 1}
                        className={selectClass}
                      >
                        <option value="">
                          {periodoOptions.length === 1
                            ? 'Período selecionado automaticamente'
                            : 'Selecione um período...'}
                        </option>
                        {periodoOptions.map((option) => (
                          <option key={option.id} value={String(option.id)}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {periodoOptions.length > 1 && effectivePeriodoId === '' && (
                        <p className="text-xs text-red-500 mt-1">Selecione um período para esta turma</p>
                      )}
                    </div>
                  )}
                  {periodoOptions.length === 0 && disciplinaParaEdicao && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-md p-3">
                        Nenhum período vinculado a esta disciplina. Cadastre períodos no curso correspondente para vincular turmas.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professor responsável *</label>
                    <select
                      name="professorId"
                      defaultValue={turma.professorId}
                      className={selectClass}
                    >
                      <option value="">Selecione um professor...</option>
                      {professores.map((p: any) => (
                        <option key={p.matricula} value={p.matricula}>
                          {p.pessoa?.nome || 'Nome não informado'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coorte (opcional)</label>
                    <select
                      name="coorteId"
                      value={selectedCoorteId === '' ? '' : selectedCoorteId}
                      onChange={(e) => setSelectedCoorteId(e.target.value ? Number(e.target.value) : '')}
                      disabled={!coortes.length}
                      className={cn(selectClass, "disabled:opacity-50 disabled:bg-slate-100")}
                    >
                      <option value="">
                        {coortes.length ? 'Sem coorte específica (oferta geral)' : 'Escolha um curso com coortes cadastradas'}
                      </option>
                      {coortes.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.rotulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormSection>

              <div className="border-t border-slate-200"></div>

              <FormSection
                icon={MapPin}
                title="Logística"
                description="Local e horário das aulas"
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
              >
                <div className="grid gap-6 md:grid-cols-12">
                  <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                    <Input name="sala" defaultValue={turma.sala || ''} placeholder="Ex: Sala 101, Lab A" className="h-11" />
                  </div>

                  {turnoHorarios.length > 0 && (
                    <div className="md:col-span-12 space-y-3">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Horários do turno
                          </label>
                          <p className="text-xs text-slate-500">
                            {useCustomHorario
                              ? 'Modo personalizado ativo. Ajuste os campos abaixo manualmente.'
                              : 'Selecione um dos horários configurados para o turno.'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleHorarioModeToggle}
                        >
                          {useCustomHorario ? 'Usar horários do turno' : 'Horário personalizado'}
                        </Button>
                      </div>

                      {!useCustomHorario ? (
                        <div className="space-y-2">
                          {turnoHorarios.map((horario: any, index: number) => {
                            const optionValue = buildHorarioOptionValue(horario, index);
                            const descricao =
                              horario.descricao ||
                              `${horario.ordem ? `${horario.ordem}º` : `${index + 1}º`} horário`;
                            const selected = selectedTurnoHorarioId === optionValue;
                            return (
                              <label
                                key={optionValue}
                                className={cn(
                                  'flex items-center justify-between rounded-lg border p-3 text-sm',
                                  selected
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 hover:border-slate-400',
                                )}
                              >
                                <div>
                                  <p className="font-medium">{descricao}</p>
                                  <p className="text-xs text-slate-500">
                                    {formatHorario(horario.horaInicio)} - {formatHorario(horario.horaFim)}
                                  </p>
                                </div>
                                <input
                                  type="radio"
                                  className="sr-only"
                                  name="turnoHorarioSelecionado"
                                  value={optionValue}
                                  checked={selected}
                                  onChange={() => handleTurnoHorarioSelect(optionValue)}
                                />
                                <span
                                  className={cn(
                                    'h-3 w-3 rounded-full border',
                                    selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300',
                                  )}
                                />
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Os horários do turno estão disponíveis acima apenas para consulta – ajuste os campos abaixo livremente.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seção</label>
                    <Input name="secao" defaultValue={turma.secao || ''} placeholder="Ex: A, B, C" className="h-11" />
                  </div>
                  {turnoHorarios.length === 0 && effectivePeriodoId !== '' && (
                    <div className="md:col-span-12">
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                        Este turno ainda não possui horários configurados. Informe o horário manualmente.
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
                    <select
                      value={diaSemana}
                      onChange={(e) => setDiaSemana(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Selecione...</option>
                      <option value="0">Domingo</option>
                      <option value="1">Segunda-feira</option>
                      <option value="2">Terça-feira</option>
                      <option value="3">Quarta-feira</option>
                      <option value="4">Quinta-feira</option>
                      <option value="5">Sexta-feira</option>
                      <option value="6">Sábado</option>
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário Início</label>
                    <TimeInput 
                      value={horarioInicio} 
                      onChange={(e) => setHorarioInicio(e.target.value)} 
                      className="h-11"
                      disabled={!useCustomHorario && turnoHorarios.length > 0}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário Fim</label>
                    <TimeInput 
                      value={horarioFim} 
                      onChange={(e) => setHorarioFim(e.target.value)} 
                      className="h-11"
                      disabled={!useCustomHorario && turnoHorarios.length > 0}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection
                icon={Calendar}
                title="Período Letivo"
                description="Datas de início e fim das aulas"
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                    <DatePicker 
                      value={dataInicio} 
                      onChange={setDataInicio}
                      placeholder="Selecione a data de início"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                    <DatePicker 
                      value={dataFim} 
                      onChange={setDataFim}
                      placeholder="Selecione a data de término"
                    />
                  </div>
                </div>
              </FormSection>

              {disciplinaParaEdicao && (
                <>
                  <div className="border-t border-slate-200"></div>
                  <FormSection
                    icon={FileText}
                    title="Plano de Ensino Personalizado"
                    description="Ajuste apenas se precisar diferenciar do padrão da disciplina"
                    iconBgColor="bg-amber-100"
                    iconColor="text-amber-600"
                  >
                    <div className="space-y-6">
                      {OVERRIDE_KEYS.map((field) => {
                        const disciplinaValue = (disciplinaParaEdicao?.[field] as string | undefined) ?? '';
                        const turmaValue = overrideFields[field];
                        const displayValue = turmaValue ?? '';
                        return (
                          <div key={field} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <label className="block text-sm font-semibold text-gray-700">{FIELD_LABELS[field]}</label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setOverrideFields((prev) => ({
                                    ...prev,
                                    [field]: disciplinaValue || null,
                                  }))
                                }
                                className="text-xs h-8"
                              >
                                Copiar da disciplina
                              </Button>
                            </div>
                            <RichTextEditor
                              value={displayValue}
                              onChange={(value) =>
                                setOverrideFields((prev) => ({
                                  ...prev,
                                  [field]: value || null,
                                }))
                              }
                              placeholder={`Personalize ${FIELD_LABELS[field].toLowerCase()} para esta turma...`}
                              rows={4}
                              className="bg-white"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </FormSection>
                </>
              )}

              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <p className="text-sm text-slate-600">
                  Sugestão de nome: <span className="font-semibold text-slate-900">{nomeSugestao}</span>
                </p>
              </div>

              <ActionsBar
                submitLabel="Atualizar Turma"
                submittingLabel="Salvando..."
                isSubmitting={updateMutation.isPending}
                cancelTo="/turmas"
              />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

