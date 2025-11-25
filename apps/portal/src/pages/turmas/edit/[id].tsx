import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { HorarioSelector } from '@/components/forms/horario-selector';
import { apiService } from '@/services/api';
import { CreateTurma } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

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
  const [horario, setHorario] = React.useState<string>('');
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
    setHorario(turma.horario || '');
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

  if (isLoading || !turma) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/turmas" className="ml-2">
                <Button variant="ghost" size="icon" title="Voltar">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Editar Turma</h1>
                <nav className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <Link to="/turmas" className="hover:text-slate-700">
                    Turmas
                  </Link>
                  <span>/</span>
                  <span className="text-slate-900">{turma.disciplina?.codigo || turma.id}</span>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Dados da turma</CardTitle>
            <CardDescription>Atualize as informações da oferta</CardDescription>
          </CardHeader>
          <CardContent>
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
                  horario: horario || '',
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
              <section className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Curso e disciplina *</label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      name="cursoId"
                      value={selectedCursoId === '' ? '' : selectedCursoId}
                      onChange={(e) => setSelectedCursoId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione um curso...</option>
                      {cursos.map((curso: any) => (
                        <option key={curso.id} value={curso.id}>
                          {curso.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      name="disciplinaId"
                      value={selectedDisciplinaId === '' ? '' : selectedDisciplinaId}
                      onChange={(e) => setSelectedDisciplinaId(e.target.value ? Number(e.target.value) : '')}
                      disabled={typeof selectedCursoId !== 'number'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
                  </div>
                  <p className="text-xs text-gray-500">{periodoInfo}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professor responsável *</label>
                  <select
                    name="professorId"
                    defaultValue={turma.professorId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um professor...</option>
                      {professores.map((p: any) => (
                        <option key={p.matricula} value={p.matricula}>
                          {p.pessoa?.nomeCompleto || 'Nome não informado'}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                  <Input name="sala" defaultValue={turma.sala || ''} placeholder="Ex: Sala 101, Lab A" />
                </div>
                <div className="md:col-span-2">
                  <HorarioSelector
                    value={horario}
                    onChange={setHorario}
                    name="horario"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seção</label>
                  <Input name="secao" defaultValue={turma.secao || ''} placeholder="Ex: A, B, C" />
                </div>
              </section>

              {disciplinaParaEdicao && (
                <section className="border-t border-gray-200 pt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Plano de ensino personalizado</h3>
                    <p className="text-sm text-gray-600">
                      Ajuste os campos abaixo apenas se precisar diferenciar esta turma do plano padrão da disciplina.
                    </p>
                  </div>
                  {OVERRIDE_KEYS.map((field) => {
                    const disciplinaValue = (disciplinaParaEdicao?.[field] as string | undefined) ?? '';
                    const turmaValue = overrideFields[field];
                    const displayValue = turmaValue ?? '';
                    return (
                      <div key={field}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">{FIELD_LABELS[field]}</label>
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
                          >
                            Usar texto da disciplina
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
                        />
                      </div>
                    );
                  })}
                </section>
              )}

              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Sugestão de nome: <span className="font-medium text-gray-900">{nomeSugestao}</span>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Salvando...' : 'Atualizar turma'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/turmas')}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

