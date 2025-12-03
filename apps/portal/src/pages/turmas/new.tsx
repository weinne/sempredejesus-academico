import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeInput } from '@/components/ui/time-input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
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
import { apiService } from '@/services/api';
import { CreateTurma } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, MapPin, FileText, GraduationCap, Calendar, Clock } from 'lucide-react';
import CrudHeader from '@/components/crud/crud-header';
import { FormSection, ActionsBar } from '@/components/forms';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Controller } from 'react-hook-form';

const buildHorarioOptionValue = (horario: any, index: number) =>
  horario?.id || `${horario?.horaInicio}-${horario?.horaFim}-${index}`;

const formatHorario = (value?: string | null) => (value ? value.slice(0, 5) : '');

export default function TurmaNewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCursoId, setSelectedCursoId] = React.useState<number | ''>('');
  const [selectedDisciplinaId, setSelectedDisciplinaId] = React.useState<number | ''>('');
  const [selectedCoorteId, setSelectedCoorteId] = React.useState<number | ''>('');
  const [diaSemana, setDiaSemana] = React.useState<string>('');
  const [horarioInicio, setHorarioInicio] = React.useState<string>('');
  const [horarioFim, setHorarioFim] = React.useState<string>('');
  const [selectedPeriodoId, setSelectedPeriodoId] = React.useState<number | ''>('');
  const [shouldAutoSelectPeriodo, setShouldAutoSelectPeriodo] = React.useState(false);
  const [selectedTurnoHorarioId, setSelectedTurnoHorarioId] = React.useState<string>('');
  const [useCustomHorario, setUseCustomHorario] = React.useState(true);
  const [horarioModeManuallySet, setHorarioModeManuallySet] = React.useState(false);
  const previousPeriodoRef = React.useRef<number | ''>('');
  const [dataInicio, setDataInicio] = React.useState<string | null>(null);
  const [dataFim, setDataFim] = React.useState<string | null>(null);
  const [overrideFields, setOverrideFields] = React.useState<{
    ementa?: string;
    bibliografia?: string;
    objetivos?: string;
    conteudoProgramatico?: string;
    instrumentosEAvaliacao?: string;
  }>({});
  const [showCreateAulasDialog, setShowCreateAulasDialog] = React.useState(false);
  const [createdTurmaId, setCreatedTurmaId] = React.useState<number | null>(null);

  const { data: cursosResponse } = useQuery({
    queryKey: ['cursos', 'turmas-form'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];

  const { data: disciplinasResponse, isFetching: disciplinasLoading } = useQuery({
    queryKey: ['disciplinas', selectedCursoId],
    queryFn: () => apiService.getDisciplinas({ limit: 200, cursoId: Number(selectedCursoId) }),
    enabled: typeof selectedCursoId === 'number',
  });
  const disciplinas = disciplinasResponse?.data || [];

  const { data: professoresResponse } = useQuery({
    queryKey: ['professores', 'turmas-form'],
    queryFn: () => apiService.getProfessores({ limit: 200 }),
  });
  const professores = professoresResponse?.data || [];

  const { data: coortesResponse } = useQuery({
    queryKey: ['coortes', selectedCursoId],
    queryFn: () => apiService.getCoortes({ cursoId: Number(selectedCursoId) }),
    enabled: typeof selectedCursoId === 'number',
  });
  const coortes = coortesResponse || [];

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

  React.useEffect(() => {
    setSelectedDisciplinaId('');
    setSelectedCoorteId('');
    setSelectedPeriodoId('');
    setHorarioModeManuallySet(false);
    setShouldAutoSelectPeriodo(false);
    setOverrideFields({});
  }, [selectedCursoId]);

  const selectedDisciplina = React.useMemo(
    () => disciplinas.find((d: any) => d.id === Number(selectedDisciplinaId)),
    [disciplinas, selectedDisciplinaId],
  );

  React.useEffect(() => {
    const periodosDisciplina = selectedDisciplina?.periodos ?? [];

    if (!shouldAutoSelectPeriodo) {
      setSelectedPeriodoId((prev) => {
        if (prev === '') {
          return '';
        }
        const aindaValido = periodosDisciplina.some(
          (p: any) => (p.periodo?.id ?? p.periodoId) === prev,
        );
        return aindaValido ? prev : '';
      });
      return;
    }

    if (periodosDisciplina.length === 1) {
      const unicoId = periodosDisciplina[0].periodo?.id ?? periodosDisciplina[0].periodoId;
      setSelectedPeriodoId(unicoId ?? '');
      setShouldAutoSelectPeriodo(false);
      return;
    }

    setSelectedPeriodoId('');
    setShouldAutoSelectPeriodo(false);
  }, [selectedDisciplina, shouldAutoSelectPeriodo]);

  React.useEffect(() => {
    setHorarioModeManuallySet(false);
  }, [selectedPeriodoId]);

  const nomeSugestao = React.useMemo(() => {
    if (!selectedDisciplina) return 'Selecione um curso e disciplina';
    const coorte = coortes.find((c: any) => c.id === Number(selectedCoorteId));
    return coorte ? `${selectedDisciplina.nome} — ${coorte.rotulo}` : selectedDisciplina.nome;
  }, [selectedDisciplina, selectedCoorteId, coortes]);

  const periodoInfo = React.useMemo(() => {
    if (!selectedDisciplina || !Array.isArray(selectedDisciplina.periodos) || !selectedDisciplina.periodos.length) {
      return 'Selecione uma disciplina para visualizar o período vinculado.';
    }
    const vinculo = selectedDisciplina.periodos[0];
    const periodo = vinculo.periodo;
    if (periodo?.nome) return periodo.nome;
    if (periodo?.numero !== undefined) return `Período ${periodo.numero}`;
    return `Período ${vinculo.periodoId}`;
  }, [selectedDisciplina]);

  const periodoOptions = React.useMemo(() => {
    if (!selectedDisciplina || !Array.isArray(selectedDisciplina.periodos)) {
      return [];
    }
    return (
      selectedDisciplina.periodos
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
  }, [selectedDisciplina, turnoNomeMap]);

  const selectedPeriodoLink = React.useMemo(() => {
    if (selectedPeriodoId === '' || !selectedDisciplina || !Array.isArray(selectedDisciplina.periodos)) {
      return null;
    }
    return (
      selectedDisciplina.periodos.find(
        (link: any) => (link.periodo?.id ?? link.periodoId) === selectedPeriodoId,
      ) || null
    );
  }, [selectedDisciplina, selectedPeriodoId]);

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
    if (selectedPeriodoId !== '' && turnoHorarios.length > 0) {
      setUseCustomHorario(false);
    } else {
      setUseCustomHorario(true);
    }
  }, [selectedPeriodoId, turnoHorarios, horarioModeManuallySet]);

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

    const currentIndex = turnoHorarios.findIndex(
      (horario: any, index: number) => buildHorarioOptionValue(horario, index) === selectedTurnoHorarioId,
    );
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
    previousPeriodoRef.current = selectedPeriodoId;
  }, [useCustomHorario, turnoHorarios, selectedTurnoHorarioId, selectedPeriodoId, horarioInicio, horarioFim]);

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
  }, [turnoHorarios, useCustomHorario, handleTurnoHorarioSelect]);

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

  const createMutation = useMutation({
    mutationFn: (payload: CreateTurma) => apiService.createTurma(payload),
    onSuccess: async (data) => {
      const turmaId = data.id;
      
      // Adiciona a nova turma diretamente ao cache de 'turmas-options' para garantir disponibilidade imediata
      // A página batch usa .then((r) => r.data), então o cache armazena apenas o array
      queryClient.setQueryData(['turmas-options'], (oldData: any) => {
        // Se oldData é um array (formato esperado pela página batch)
        if (Array.isArray(oldData)) {
          const exists = oldData.some((t: any) => t.id === data.id);
          if (exists) return oldData;
          return [...oldData, data];
        }
        // Se oldData tem estrutura { data, pagination }, extrai o array
        if (oldData?.data && Array.isArray(oldData.data)) {
          const exists = oldData.data.some((t: any) => t.id === data.id);
          if (exists) return oldData;
          return {
            ...oldData,
            data: [...oldData.data, data],
          };
        }
        // Se não há dados, retorna a nova turma em um array (formato esperado pela página batch)
        return [data];
      });
      
      // Também atualiza o cache completo caso a query seja refeita
      queryClient.setQueryData(['turmas'], (oldData: any) => {
        if (oldData?.data && Array.isArray(oldData.data)) {
          const exists = oldData.data.some((t: any) => t.id === data.id);
          if (exists) return oldData;
          return {
            ...oldData,
            data: [...oldData.data, data],
          };
        }
        return oldData;
      });
      
      // Invalida e refetch das queries relacionadas a turmas
      await queryClient.invalidateQueries({ queryKey: ['turmas'] });
      await queryClient.invalidateQueries({ queryKey: ['turmas-options'] });
      await queryClient.refetchQueries({ queryKey: ['turmas'] });
      
      toast({ title: 'Turma criada', description: 'Turma criada com sucesso!' });
      setCreatedTurmaId(turmaId);
      setShowCreateAulasDialog(true);
    },
    onError: (error: any) =>
      toast({ title: 'Erro ao criar turma', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const handleCreateAulas = async () => {
    if (createdTurmaId) {
      // Garante que o cache está atualizado antes de navegar
      await queryClient.refetchQueries({ queryKey: ['turmas-options'] });
      navigate(`/aulas/batch?turmaId=${createdTurmaId}`);
    } else {
      navigate('/turmas');
    }
  };

  const handleSkipCreateAulas = () => {
    navigate('/turmas');
  };

  // Estilos comuns
  const selectClass = "w-full h-11 px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <CrudHeader
        title="Nova Turma"
        description="Cadastrar nova oferta de disciplina"
        backTo="/turmas"
      />

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Nova Turma</h1>
            <p className="mt-1 text-sm text-slate-600">Preencha as informações principais da oferta</p>
          </div>

          <div className="px-8 py-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                const professorIdValue = String(fd.get('professorId') || '').trim();
                if (!professorIdValue) {
                  toast({
                    title: 'Erro ao criar turma',
                    description: 'Selecione um professor responsável',
                    variant: 'destructive',
                  });
                  return;
                }

                if (periodoOptions.length > 1 && selectedPeriodoId === '') {
                  toast({
                    title: 'Período obrigatório',
                    description: 'Selecione o período ao qual esta turma estará vinculada.',
                    variant: 'destructive',
                  });
                  return;
                }

                createMutation.mutate({
                  disciplinaId: Number(fd.get('disciplinaId')),
                  professorId: professorIdValue,
                  coorteId: fd.get('coorteId') ? Number(fd.get('coorteId')) : undefined,
                  sala: String(fd.get('sala') || ''),
                  diaSemana: diaSemana ? Number(diaSemana) : undefined,
                  periodoId:
                    selectedPeriodoId === ''
                      ? undefined
                      : Number(selectedPeriodoId),
                  horarioInicio: horarioInicio || undefined,
                  horarioFim: horarioFim || undefined,
                  dataInicio: dataInicio || undefined,
                  dataFim: dataFim || undefined,
                  secao: String(fd.get('secao') || ''),
                  ementa: overrideFields.ementa || null,
                  bibliografia: overrideFields.bibliografia || null,
                  objetivos: overrideFields.objetivos || null,
                  conteudoProgramatico: overrideFields.conteudoProgramatico || null,
                  instrumentosEAvaliacao: overrideFields.instrumentosEAvaliacao || null,
                } as any);
              }}
              className="space-y-8"
            >
              {/* Seção 1: Dados Básicos */}
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
                        value={selectedCursoId === '' ? '' : selectedCursoId}
                        onChange={(e) => setSelectedCursoId(e.target.value ? Number(e.target.value) : '')}
                        className={selectClass}
                      >
                        <option value="">Selecione um curso...</option>
                        {cursos.map((curso: any) => (
                          <option key={curso.id} value={curso.id}>
                            {curso.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina *</label>
                      <select
                        name="disciplinaId"
                        value={selectedDisciplinaId === '' ? '' : selectedDisciplinaId}
                        onChange={(e) => handleDisciplinaChange(e.target.value)}
                        disabled={typeof selectedCursoId !== 'number' || disciplinasLoading}
                        className={cn(selectClass, "disabled:opacity-50 disabled:bg-slate-100")}
                      >
                        <option value="">
                          {selectedCursoId ? 'Selecione uma disciplina...' : 'Escolha um curso primeiro'}
                        </option>
                        {disciplinas.map((d: any) => (
                          <option key={d.id} value={d.id}>
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
                        value={selectedPeriodoId === '' ? '' : selectedPeriodoId}
                        onChange={(e) =>
                          setSelectedPeriodoId(e.target.value ? Number(e.target.value) : '')
                        }
                        className={selectClass}
                        disabled={periodoOptions.length === 1}
                      >
                        <option value="">
                          {periodoOptions.length === 1
                            ? 'Período selecionado automaticamente'
                            : 'Selecione um período...'}
                        </option>
                        {periodoOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {periodoOptions.length > 1 && selectedPeriodoId === '' && (
                        <p className="text-xs text-red-500 mt-1">Selecione um período para esta turma</p>
                      )}
                    </div>
                  )}
                  {periodoOptions.length === 0 && selectedDisciplina && (
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
                      className={selectClass}
                      required
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

              {/* Seção 2: Logística */}
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
                    <Input name="sala" placeholder="Ex: Sala 101, Lab A" className="h-11" />
                  </div>
                  
                  <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seção</label>
                    <Input name="secao" placeholder="Ex: A, B, C" className="h-11" />
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
                                    {horario.horaInicio} - {horario.horaFim}
                                  </p>
                                </div>
                                <input
                                  type="radio"
                                  className="sr-only"
                                  name="turnoHorarioEscolhido"
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

                  {turnoHorarios.length === 0 && selectedPeriodoId !== '' && (
                    <div className="md:col-span-12">
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                        Este turno ainda não possui horários configurados. Defina manualmente abaixo.
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

              {/* Seção 3: Datas */}
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

              {selectedDisciplina && (
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
                      {(['ementa', 'bibliografia', 'objetivos', 'conteudoProgramatico', 'instrumentosEAvaliacao'] as const).map((field) => {
                        const fieldLabelMap: Record<typeof field, string> = {
                          ementa: 'Ementa',
                          bibliografia: 'Bibliografia',
                          objetivos: 'Objetivos',
                          conteudoProgramatico: 'Conteúdo Programático',
                          instrumentosEAvaliacao: 'Instrumentos e Critérios de Avaliação',
                        };
                        const fieldLabel = fieldLabelMap[field];
                        const disciplinaValue = selectedDisciplina[field as keyof typeof selectedDisciplina] as string | undefined || '';

                        return (
                          <div key={field} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <label className="block text-sm font-semibold text-gray-700">{fieldLabel}</label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setOverrideFields((prev) => ({
                                    ...prev,
                                    [field]: disciplinaValue,
                                  }))
                                }
                                className="text-xs h-8"
                              >
                                Copiar da disciplina
                              </Button>
                            </div>
                            <RichTextEditor
                              value={overrideFields[field as keyof typeof overrideFields] || ''}
                              onChange={(value) => setOverrideFields((prev) => ({ ...prev, [field]: value }))}
                              placeholder={`Personalize ${fieldLabel.toLowerCase()} para esta turma...`}
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
                  Sugestão de nome para a turma: <span className="font-semibold text-slate-900">{nomeSugestao}</span>
                </p>
              </div>

              <ActionsBar
                submitLabel="Criar Turma"
                submittingLabel="Criando..."
                isSubmitting={createMutation.isPending}
                cancelTo="/turmas"
              />
            </form>
          </div>
        </div>
      </main>

      {/* Dialog para perguntar se deseja criar aulas */}
      <AlertDialog open={showCreateAulasDialog} onOpenChange={setShowCreateAulasDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turma criada com sucesso!</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja criar aulas em lote para esta turma agora? Você pode configurar a recorrência semanal e gerar todas as aulas automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipCreateAulas}>
              Não, apenas ver a turma
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateAulas}>
              Sim, criar aulas em lote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
