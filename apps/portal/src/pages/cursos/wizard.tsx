import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Turno } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface DisciplineDraft {
  id: string;
  codigo: string;
  nome: string;
  creditos: string;
  cargaHoraria: string;
  ementa: string;
  bibliografia: string;
}

interface PeriodDraft {
  numero: number;
  nome: string;
  descricao: string;
  disciplinas: DisciplineDraft[];
}

interface TurnoDraft {
  turnoId: number;
  versao: string;
  vigenteDe: string;
  vigenteAte: string;
  ativo: boolean;
  periodos: PeriodDraft[];
}

interface WizardState {
  course: {
    nome: string;
    grau: string;
  };
  periodCount: number;
  turnos: TurnoDraft[];
}

const steps = [
  { id: 0, label: 'Curso' },
  { id: 1, label: 'Estrutura' },
  { id: 2, label: 'Turnos e curriculos' },
  { id: 3, label: 'Disciplinas' },
  { id: 4, label: 'Resumo' },
];

const emptyDiscipline = (): DisciplineDraft => ({
  id: Math.random().toString(36).slice(2),
  codigo: '',
  nome: '',
  creditos: '',
  cargaHoraria: '',
  ementa: '',
  bibliografia: '',
});

const emptyPeriod = (numero: number): PeriodDraft => ({
  numero,
  nome: `Periodo ${numero}`,
  descricao: '',
  disciplinas: [],
});

const buildPeriods = (count: number): PeriodDraft[] =>
  Array.from({ length: count }, (_, index) => emptyPeriod(index + 1));

const isPositiveNumber = (value: string): boolean => {
  if (!value) {
    return false;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

export default function CursoWizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [wizardData, setWizardData] = React.useState<WizardState>({
    course: {
      nome: '',
      grau: '',
    },
    periodCount: 4,
    turnos: [],
  });

  const { data: turnosData, isLoading: isLoadingTurnos } = useQuery({
    queryKey: ['turnos'],
    queryFn: () => apiService.getTurnos(),
  });

  const createCursoMutation = useMutation({
    mutationFn: async () => {
      const createdCurso = await apiService.createCurso({
        nome: wizardData.course.nome.trim(),
        grau: wizardData.course.grau,
      });

      for (const turnoConfig of wizardData.turnos) {
        const curriculo = await apiService.createCurriculo({
          cursoId: createdCurso.id,
          turnoId: turnoConfig.turnoId,
          versao: turnoConfig.versao || 'v1.0',
          vigenteDe: turnoConfig.vigenteDe || undefined,
          vigenteAte: turnoConfig.vigenteAte || undefined,
          ativo: turnoConfig.ativo,
        });

        for (let index = 0; index < turnoConfig.periodos.length; index++) {
          const periodo = turnoConfig.periodos[index];
          const numeroParsed = Number(periodo.numero);
          const fallbackNumero = index + 1;
          const numeroValue = Number.isFinite(numeroParsed) && numeroParsed > 0 ? numeroParsed : fallbackNumero;

          const createdPeriodo = await apiService.createPeriodo({
            cursoId: createdCurso.id,
            turnoId: turnoConfig.turnoId,
            curriculoId: curriculo.id,
            numero: numeroValue,
            nome: periodo.nome || undefined,
            descricao: periodo.descricao || undefined,
          });

          for (const disciplina of periodo.disciplinas) {
            if (!disciplina.nome || !disciplina.codigo) {
              continue;
            }

            await apiService.createDisciplina({
              cursoId: createdCurso.id,
              periodoId: createdPeriodo.id,
              codigo: disciplina.codigo,
              nome: disciplina.nome,
              creditos: Number(disciplina.creditos),
              cargaHoraria: Number(disciplina.cargaHoraria),
              ementa: disciplina.ementa || undefined,
              bibliografia: disciplina.bibliografia || undefined,
              ativo: true,
            });
          }
        }
      }

      return createdCurso;
    },
    onSuccess: (createdCurso) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curriculos'] });
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({
        title: 'Curso configurado',
        description: 'Wizard concluido com sucesso. Curso pronto para uso.',
      });
      navigate(`/cursos/view/${createdCurso.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao finalizar wizard',
        description: error?.message || 'Nao foi possivel concluir a configuracao.',
        variant: 'destructive',
      });
    },
  });

  const availableTurnos = turnosData || [];

  const updateCourseField = (field: 'nome' | 'grau', value: string) => {
    setWizardData((prev) => ({
      ...prev,
      course: {
        ...prev.course,
        [field]: value,
      },
    }));
  };

  const updatePeriodCount = (value: string) => {
    const parsed = Number(value);
    const safeValue = Number.isFinite(parsed) ? Math.max(1, Math.min(12, Math.floor(parsed))) : 1;

    setWizardData((prev) => {
      const periodCount = safeValue;
      const turnos = prev.turnos.map((turno) => {
        let periodos = turno.periodos.slice(0, periodCount);
        if (periodos.length < periodCount) {
          const additions = Array.from({ length: periodCount - periodos.length }, (_, idx) =>
            emptyPeriod(periodos.length + idx + 1)
          );
          periodos = [...periodos, ...additions];
        }
        return {
          ...turno,
          periodos,
        };
      });
      return {
        ...prev,
        periodCount,
        turnos,
      };
    });
  };

  const toggleTurno = (turno: Turno) => {
    setWizardData((prev) => {
      const exists = prev.turnos.find((item) => item.turnoId === turno.id);
      if (exists) {
        return {
          ...prev,
          turnos: prev.turnos.filter((item) => item.turnoId !== turno.id),
        };
      }

      const draft: TurnoDraft = {
        turnoId: turno.id,
        versao: 'v1.0',
        vigenteDe: '',
        vigenteAte: '',
        ativo: true,
        periodos: buildPeriods(prev.periodCount),
      };

      return {
        ...prev,
        turnos: [...prev.turnos, draft].sort((a, b) => a.turnoId - b.turnoId),
      };
    });
  };

  const updateTurnoField = (turnoId: number, field: keyof TurnoDraft, value: string | boolean) => {
    setWizardData((prev) => ({
      ...prev,
      turnos: prev.turnos.map((turno) =>
        turno.turnoId === turnoId
          ? {
              ...turno,
              [field]: value,
            }
          : turno,
      ),
    }));
  };

  const updatePeriodField = (turnoId: number, periodId: string, field: keyof PeriodDraft, value: string) => {
    setWizardData((prev) => ({
      ...prev,
      turnos: prev.turnos.map((turno) => {
        if (turno.turnoId !== turnoId) {
          return turno;
        }
        return {
          ...turno,
          periodos: turno.periodos.map((periodo) =>
            periodo.id === periodId
              ? {
                  ...periodo,
                  [field]: value,
                }
              : periodo,
          ),
        };
      }),
    }));
  };

  const addDiscipline = (turnoId: number, numero: number) => {
    setWizardData((prev) => ({
      ...prev,
      turnos: prev.turnos.map((turno) => {
        if (turno.turnoId !== turnoId) {
          return turno;
        }
        return {
          ...turno,
          periodos: turno.periodos.map((periodo) =>
            periodo.numero === numero
              ? {
                  ...periodo,
                  disciplinas: [...periodo.disciplinas, emptyDiscipline()],
                }
              : periodo,
          ),
        };
      }),
    }));
  };

  const updateDisciplineField = (
    turnoId: number,
    periodId: string,
    disciplineId: string,
    field: keyof DisciplineDraft,
    value: string,
  ) => {
    setWizardData((prev) => ({
      ...prev,
      turnos: prev.turnos.map((turno) => {
        if (turno.turnoId !== turnoId) {
          return turno;
        }
        return {
          ...turno,
          periodos: turno.periodos.map((periodo) => {
            if (periodo.id !== periodId) {
              return periodo;
            }
            return {
              ...periodo,
              disciplinas: periodo.disciplinas.map((disciplina) =>
                disciplina.id === disciplineId
                  ? { ...disciplina, [field]: value }
                  : disciplina,
              ),
            };
          }),
        };
      }),
    }));
  };

  const removeDiscipline = (turnoId: number, periodId: string, disciplineId: string) => {
    setWizardData((prev) => ({
      ...prev,
      turnos: prev.turnos.map((turno) => {
        if (turno.turnoId !== turnoId) {
          return turno;
        }
        return {
          ...turno,
          periodos: turno.periodos.map((periodo) =>
            periodo.id === periodId
              ? {
                  ...periodo,
                  disciplinas: periodo.disciplinas.filter((disciplina) => disciplina.id !== disciplineId),
                }
              : periodo,
          ),
        };
      }),
    }));
  };

  const hasIncompleteDiscipline = wizardData.turnos.some((turno) =>
    turno.periodos.some((periodo) =>
      periodo.disciplinas.some(
        (disciplina) =>
          !disciplina.nome.trim() ||
          !disciplina.codigo.trim() ||
          !isPositiveNumber(disciplina.creditos) ||
          !isPositiveNumber(disciplina.cargaHoraria),
      ),
    ),
  );

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          wizardData.course.nome.trim().length >= 2 && wizardData.course.grau.trim().length > 0
        );
      case 1:
        return wizardData.periodCount > 0;
      case 2:
        return wizardData.turnos.length > 0;
      case 3:
        return !hasIncompleteDiscipline;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep === steps.length - 1) {
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleSubmit = async () => {
    if (hasIncompleteDiscipline) {
      toast({
        title: 'Campos obrigatorios',
        description: 'Revise as disciplinas: codigo, nome, creditos e carga horaria sao obrigatorios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createCursoMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Dados do curso</CardTitle>
              <CardDescription>Informe o nome e o grau academico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do curso *</label>
                <Input
                  value={wizardData.course.nome}
                  onChange={(event) => updateCourseField('nome', event.target.value)}
                  placeholder="Ex: Bacharel em Teologia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grau *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={wizardData.course.grau}
                  onChange={(event) => updateCourseField('grau', event.target.value)}
                >
                  <option value="">Selecione o grau...</option>
                  <option value="BACHARELADO">Bacharelado</option>
                  <option value="LICENCIATURA">Licenciatura</option>
                  <option value="ESPECIALIZACAO">Especializacao</option>
                  <option value="MESTRADO">Mestrado</option>
                  <option value="DOUTORADO">Doutorado</option>
                </select>
              </div>
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Estrutura do curso</CardTitle>
              <CardDescription>Defina quantos periodos compoem o curso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de periodos *</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={wizardData.periodCount}
                  onChange={(event) => updatePeriodCount(event.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Limite maximo de 12 periodos. O valor pode ser ajustado depois.</p>
              </div>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Turnos e curriculos</CardTitle>
              <CardDescription>
                Selecione em quais turnos o curso sera ofertado e personalize o curriculo de cada um.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingTurnos ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando turnos...
                </div>
              ) : (
                <div className="space-y-4">
                  {availableTurnos.map((turno) => {
                    const selected = wizardData.turnos.some((item) => item.turnoId === turno.id);
                    const turnoDraft = wizardData.turnos.find((item) => item.turnoId === turno.id);
                    return (
                      <div key={turno.id} className="border border-gray-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => toggleTurno(turno)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left ${selected ? 'bg-blue-50 border-b border-gray-200' : ''}`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{turno.nome}</p>
                            <p className="text-xs text-gray-500">Clique para {selected ? 'remover' : 'adicionar'} este turno.</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {selected ? 'Selecionado' : 'Disponivel'}
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </button>
                        {selected && turnoDraft && (
                          <div className="p-4 space-y-3 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Versao *</label>
                                <Input
                                  value={turnoDraft.versao}
                                  onChange={(event) => updateTurnoField(turno.id, 'versao', event.target.value)}
                                  placeholder="Ex: v1.0"
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-6">
                                <input
                                  id={`turno-${turno.id}-ativo`}
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={turnoDraft.ativo}
                                  onChange={(event) => updateTurnoField(turno.id, 'ativo', event.target.checked)}
                                />
                                <label htmlFor={`turno-${turno.id}-ativo`} className="text-sm text-gray-700">Curriculo ativo</label>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vigente de</label>
                                <Input
                                  type="date"
                                  value={turnoDraft.vigenteDe}
                                  onChange={(event) => updateTurnoField(turno.id, 'vigenteDe', event.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vigente ate</label>
                                <Input
                                  type="date"
                                  value={turnoDraft.vigenteAte}
                                  onChange={(event) => updateTurnoField(turno.id, 'vigenteAte', event.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {wizardData.turnos.length === 0 && !isLoadingTurnos && (
                <p className="text-sm text-amber-600">
                  Selecione pelo menos um turno para avancar.
                </p>
              )}
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <div className="space-y-6">
            {wizardData.turnos.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-gray-600">
                  Nenhum turno selecionado. Volte ao passo anterior e adicione pelo menos um turno.
                </CardContent>
              </Card>
            ) : (
              wizardData.turnos.map((turno) => {
                const turnoInfo = availableTurnos.find((item) => item.id === turno.turnoId);
                return (
                  <Card key={turno.turnoId}>
                    <CardHeader>
                      <CardTitle>{turnoInfo?.nome || 'Turno'}</CardTitle>
                      <CardDescription>
                        Configure os periodos e disciplinas para este turno.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {turno.periodos.map((periodo) => (
                        <div key={periodo.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <h4 className="text-sm font-semibold text-gray-800">Configuracao do periodo</h4>
                              <p className="text-xs text-gray-500">Cadastre as disciplinas que compoem este periodo no turno selecionado.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Numero *</label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={periodo.numero}
                                  onChange={(event) => updatePeriodField(turno.turnoId, periodo.id, 'numero', event.target.value)}
                                  placeholder="Ex: 1"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">E permitido repetir numeros conforme necessario.</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Nome opcional</label>
                                <Input
                                  value={periodo.nome}
                                  onChange={(event) => updatePeriodField(turno.turnoId, periodo.id, 'nome', event.target.value)}
                                  placeholder="Nome do periodo (opcional)"
                                />
                              </div>
                            </div>
                          </div>
                          <Textarea
                            value={periodo.descricao}
                            onChange={(event) => updatePeriodField(turno.turnoId, periodo.id, 'descricao', event.target.value)}
                            placeholder="Descricao opcional do periodo"
                          />
                          <div className="space-y-3">
                            {periodo.disciplinas.length === 0 && (
                              <p className="text-xs text-gray-500">Nenhuma disciplina adicionada ainda.</p>
                            )}
                            {periodo.disciplinas.map((disciplina) => (
                              <div key={disciplina.id} className="border border-dashed border-gray-300 rounded-md p-4 space-y-3 bg-gray-50">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <h5 className="text-sm font-medium text-gray-700">Disciplina</h5>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDiscipline(turno.turnoId, periodo.id, disciplina.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Remover
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Codigo *</label>
                                    <Input
                                      value={disciplina.codigo}
                                      onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'codigo', event.target.value)}
                                      placeholder="Ex: DISC101"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                                    <Input
                                      value={disciplina.nome}
                                      onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'nome', event.target.value)}
                                      placeholder="Nome da disciplina"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Creditos *</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={disciplina.creditos}
                                      onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'creditos', event.target.value)}
                                      placeholder="Ex: 4"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Carga horaria (horas) *</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={disciplina.cargaHoraria}
                                      onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'cargaHoraria', event.target.value)}
                                      placeholder="Ex: 60"
                                    />
                                  </div>
                                </div>
                                <Textarea
                                  value={disciplina.ementa}
                                  onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'ementa', event.target.value)}
                                  placeholder="Ementa (opcional)"
                                />
                                <Textarea
                                  value={disciplina.bibliografia}
                                  onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'bibliografia', event.target.value)}
                                  placeholder="Bibliografia (opcional)"
                                />
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addDiscipline(turno.turnoId, periodo.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" /> Adicionar disciplina
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })
            )}
            {hasIncompleteDiscipline && (
              <p className="text-sm text-red-600">
                Existem disciplinas com campos obrigatorios vazios. Complete ou remova as entradas pendentes antes de continuar.
              </p>
            )}
          </div>
        );
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Resumo da configuracao</CardTitle>
              <CardDescription>Revise os dados antes de finalizar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Curso</h4>
                <p><strong>Nome:</strong> {wizardData.course.nome}</p>
                <p><strong>Grau:</strong> {wizardData.course.grau}</p>
                <p><strong>Periodos:</strong> {wizardData.periodCount}</p>
              </div>
              {wizardData.turnos.map((turno) => {
                const turnoInfo = availableTurnos.find((item) => item.id === turno.turnoId);
                return (
                  <div key={turno.turnoId} className="border border-gray-200 rounded-md p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <h5 className="text-sm font-semibold text-gray-800">{turnoInfo?.nome || 'Turno'}</h5>
                    </div>
                    <p><strong>Versao:</strong> {turno.versao || 'v1.0'}</p>
                    <p><strong>Status:</strong> {turno.ativo ? 'Ativo' : 'Inativo'}</p>
                    <p><strong>Vigencia:</strong> {turno.vigenteDe || 'Nao informado'} - {turno.vigenteAte || 'Nao informado'}</p>
                    {turno.periodos.map((periodo) => (
                      <div key={periodo.id} className="pl-4 border-l border-dashed border-gray-300 space-y-1">
                        <p className="font-medium">Periodo {periodo.numero} - {periodo.nome || 'Sem nome'}</p>
                        <p className="text-xs text-gray-500">Disciplinas: {periodo.disciplinas.length}</p>
                        {periodo.disciplinas.length > 0 && (
                          <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                            {periodo.disciplinas.map((disciplina) => (
                              <li key={disciplina.id}>
                                <strong>{disciplina.codigo}</strong> - {disciplina.nome} ({disciplina.cargaHoraria}h / {disciplina.creditos} cred.)
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
              {wizardData.turnos.length === 0 && (
                <p className="text-sm text-amber-600">Nenhum turno selecionado. Volte e escolha pelo menos um turno.</p>
              )}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title="Wizard de configuracao de curso"
        description="Guia passo a passo para criar um curso completo."
        backTo="/cursos"
        icon={<Sparkles className="h-5 w-5 text-blue-500" />}
      />

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Etapas</h3>
              <ol className="space-y-3 text-sm">
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  return (
                    <li key={step.id}>
                      <div
                        className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                          isActive ? 'bg-blue-100 text-blue-700 font-semibold' : isCompleted ? 'bg-green-50 text-green-700' : 'text-gray-600'
                        }`}
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-bold">
                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                        </span>
                        <span>{step.label}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </aside>

            <section className="space-y-6">
              {renderStepContent()}

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => (currentStep === 0 ? navigate('/cursos') : goBack())}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {currentStep === 0 ? 'Cancelar' : 'Voltar'}
                </Button>
                <div className="flex gap-3">
                  {currentStep < steps.length - 1 && (
                    <Button
                      onClick={goNext}
                      disabled={!canProceed()}
                    >
                      Avancar
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {currentStep === steps.length - 1 && (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || wizardData.turnos.length === 0}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Finalizando...
                        </>
                      ) : (
                        'Concluir wizard'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}



















