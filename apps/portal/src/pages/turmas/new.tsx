import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { apiService } from '@/services/api';
import { CreateTurma } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function TurmaNewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCursoId, setSelectedCursoId] = React.useState<number | ''>('');
  const [selectedDisciplinaId, setSelectedDisciplinaId] = React.useState<number | ''>('');
  const [selectedCoorteId, setSelectedCoorteId] = React.useState<number | ''>('');
  const [overrideFields, setOverrideFields] = React.useState<{
    ementa?: string;
    bibliografia?: string;
    objetivos?: string;
    conteudoProgramatico?: string;
    instrumentosEAvaliacao?: string;
  }>({});

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

  React.useEffect(() => {
    setSelectedDisciplinaId('');
    setSelectedCoorteId('');
    setOverrideFields({});
  }, [selectedCursoId]);

  const selectedDisciplina = React.useMemo(
    () => disciplinas.find((d: any) => d.id === Number(selectedDisciplinaId)),
    [disciplinas, selectedDisciplinaId],
  );

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

  const createMutation = useMutation({
    mutationFn: (payload: CreateTurma) => apiService.createTurma(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast({ title: 'Turma criada', description: 'Turma criada com sucesso!' });
      navigate('/turmas');
    },
    onError: (error: any) =>
      toast({ title: 'Erro ao criar turma', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

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
                <h1 className="text-2xl font-bold text-slate-900">Nova Turma</h1>
                <nav className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <Link to="/turmas" className="hover:text-slate-700">
                    Turmas
                  </Link>
                  <span>/</span>
                  <span className="text-slate-900">Cadastrar</span>
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
            <CardDescription>Preencha as informações principais da oferta</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                createMutation.mutate({
                  disciplinaId: Number(fd.get('disciplinaId')),
                  professorId: String(fd.get('professorId') || ''),
                  coorteId: fd.get('coorteId') ? Number(fd.get('coorteId')) : undefined,
                  sala: String(fd.get('sala') || ''),
                  horario: String(fd.get('horario') || ''),
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
                      disabled={typeof selectedCursoId !== 'number' || disciplinasLoading}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                  <Input name="sala" placeholder="Ex: Sala 101, Lab A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                  <Input name="horario" placeholder="Ex: Seg 08:00-10:00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seção</label>
                  <Input name="secao" placeholder="Ex: A, B, C" />
                </div>
              </section>

              {selectedDisciplina && (
                <section className="border-t border-gray-200 pt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Plano de ensino personalizado</h3>
                    <p className="text-sm text-gray-600">
                      Ajuste os campos abaixo apenas se precisar diferenciar esta turma do plano padrão da disciplina.
                    </p>
                  </div>
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
                      <div key={field}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">{fieldLabel}</label>
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
                          >
                            Usar texto da disciplina
                          </Button>
                        </div>
                        <RichTextEditor
                          value={overrideFields[field as keyof typeof overrideFields] || ''}
                          onChange={(value) => setOverrideFields((prev) => ({ ...prev, [field]: value }))}
                          placeholder={`Personalize ${fieldLabel.toLowerCase()} para esta turma...`}
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
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Salvando...' : 'Criar turma'}
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
