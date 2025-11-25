import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, MapPin, FileText, Calendar, GraduationCap } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { DatePicker } from '@/components/ui/date-picker';
import { apiService } from '@/services/api';
import { CreateTurma } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import CrudHeader from '@/components/crud/crud-header';
import { FormSection, ActionsBar } from '@/components/forms';
import { cn } from '@/lib/utils';

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
  const [dataInicio, setDataInicio] = React.useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = React.useState<Date | undefined>(undefined);
  const [overrideFields, setOverrideFields] = React.useState<OverrideFieldsState>({});

  const { data: turma, isLoading } = useQuery({
    queryKey: ['turma', id],
    queryFn: () => apiService.getTurma(Number(id)),
    enabled: Boolean(id),
  });

  React.useEffect(() => {
    if (!turma) return;
    setSelectedCursoId(turma.disciplina?.cursoId ?? '');
    setSelectedDisciplinaId(turma.disciplinaId ?? '');
    setSelectedCoorteId(turma.coorteId ?? '');
    setDiaSemana(turma.diaSemana !== undefined && turma.diaSemana !== null ? String(turma.diaSemana) : '');
    setHorarioInicio(turma.horarioInicio || '');
    setHorarioFim(turma.horarioFim || '');
    setDataInicio(turma.dataInicio ? new Date(turma.dataInicio) : undefined);
    setDataFim(turma.dataFim ? new Date(turma.dataFim) : undefined);
    setOverrideFields({
      ementa: turma.ementa ?? null,
      bibliografia: turma.bibliografia ?? null,
      objetivos: turma.objetivos ?? null,
      conteudoProgramatico: turma.conteudoProgramatico ?? null,
      instrumentosEAvaliacao: turma.instrumentosEAvaliacao ?? null,
    });
  }, [turma]);

  React.useEffect(() => {
    if (!turma) return;
    if (selectedCursoId === (turma.disciplina?.cursoId ?? '')) return;
    setSelectedDisciplinaId('');
    setSelectedCoorteId('');
    setOverrideFields({});
  }, [selectedCursoId, turma]);

  const { data: cursosResponse } = useQuery({
    queryKey: ['cursos', 'turmas-form'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data ?? [];

  const { data: disciplinasResponse } = useQuery({
    queryKey: ['disciplinas', selectedCursoId],
    queryFn: () => apiService.getDisciplinas({ limit: 200, cursoId: Number(selectedCursoId) }),
    enabled: typeof selectedCursoId === 'number',
  });
  const disciplinas = disciplinasResponse?.data ?? [];

  const { data: professoresResponse } = useQuery({
    queryKey: ['professores', 'turmas-form'],
    queryFn: () => apiService.getProfessores({ limit: 200 }),
  });
  const professores = professoresResponse?.data ?? [];

  const { data: coortesResponse } = useQuery({
    queryKey: ['coortes', selectedCursoId],
    queryFn: () => apiService.getCoortes({ cursoId: Number(selectedCursoId) }),
    enabled: typeof selectedCursoId === 'number',
  });
  const coortes = coortesResponse ?? [];

  const selectedDisciplina = React.useMemo(
    () => disciplinas.find((d: any) => d.id === Number(selectedDisciplinaId)),
    [disciplinas, selectedDisciplinaId],
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
                updateMutation.mutate({
                  disciplinaId: Number(fd.get('disciplinaId')),
                  professorId: String(fd.get('professorId') || ''),
                  coorteId: fd.get('coorteId') ? Number(fd.get('coorteId')) : undefined,
                  sala: String(fd.get('sala') || ''),
                  diaSemana: diaSemana ? Number(diaSemana) : undefined,
                  horarioInicio: horarioInicio || undefined,
                  horarioFim: horarioFim || undefined,
                  dataInicio: dataInicio ? dataInicio.toISOString().split('T')[0] : undefined,
                  dataFim: dataFim ? dataFim.toISOString().split('T')[0] : undefined,
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
                        onChange={(e) => setSelectedDisciplinaId(e.target.value ? Number(e.target.value) : '')}
                        disabled={typeof selectedCursoId !== 'number'}
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
                  <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seção</label>
                    <Input name="secao" defaultValue={turma.secao || ''} placeholder="Ex: A, B, C" className="h-11" />
                  </div>
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
                    <Input 
                      type="time" 
                      value={horarioInicio} 
                      onChange={(e) => setHorarioInicio(e.target.value)} 
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário Fim</label>
                    <Input 
                      type="time" 
                      value={horarioFim} 
                      onChange={(e) => setHorarioFim(e.target.value)} 
                      className="h-11"
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

