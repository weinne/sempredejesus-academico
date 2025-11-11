import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { Curso, Curriculo, Disciplina, DisciplinaPeriodo, Periodo, Turno } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';

interface DisciplineDraft {
  id: string;
  persistedId?: number;
  codigo: string;
  nome: string;
  creditos: string;
  cargaHoraria: string;
  ementa: string;
  bibliografia: string;
  ordem: string;
  obrigatoria: boolean;
}

interface PeriodDraft {
  id: string;
  persistedId?: number;
  numero: string;
  nome: string;
  descricao: string;
  disciplinas: DisciplineDraft[];
}

interface TurnoDraft {
  turnoId: number;
  curriculoId?: number;
  versao: string;
  vigenteDe: string;
  vigenteAte: string;
  ativo: boolean;
  isPersisted?: boolean;
  periodos: PeriodDraft[];
}

interface WizardState {
  course: {
    id?: number;
    nome: string;
    grau: string;
  };
  periodCount: number;
  turnos: TurnoDraft[];
}

type WizardMode = 'new' | 'existing';

const createInitialWizardState = (): WizardState => ({
  course: {
    id: undefined,
    nome: '',
    grau: '',
  },
  periodCount: 4,
  turnos: [],
});

const steps = [
  { id: 0, label: 'Curso' },
  { id: 1, label: 'Estrutura' },
  { id: 2, label: 'Turnos e curriculos' },
  { id: 3, label: 'Disciplinas' },
  { id: 4, label: 'Resumo' },
];

const emptyDiscipline = (): DisciplineDraft => ({
  id: Math.random().toString(36).slice(2),
  persistedId: undefined,
  codigo: '',
  nome: '',
  creditos: '',
  cargaHoraria: '',
  ementa: '',
  bibliografia: '',
  ordem: '',
  obrigatoria: true,
});

const emptyPeriod = (numero: number): PeriodDraft => ({
  id: Math.random().toString(36).slice(2),
  persistedId: undefined,
  numero: numero.toString(),
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

const loadCourseStructure = async (cursoId: number): Promise<{
  course: Curso;
  curriculos: Curriculo[];
  periodos: Periodo[];
  disciplinas: Disciplina[];
}> => {
  const [course, curriculos, periodosResponse, disciplinasResponse] = await Promise.all([
    apiService.getCurso(cursoId),
    apiService.getCurriculos({ cursoId, limit: 100 }),
    apiService.getPeriodos({ cursoId, limit: 500 }),
    apiService.getDisciplinas({ cursoId, limit: 1000 }),
  ]);

  return {
    course,
    curriculos,
    periodos: periodosResponse.data || [],
    disciplinas: disciplinasResponse.data || [],
  };
};

export default function CursoWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [wizardData, setWizardData] = React.useState<WizardState>(() => createInitialWizardState());

  const [mode, setMode] = React.useState<WizardMode>('new');
  const [selectedExistingCourseId, setSelectedExistingCourseId] = React.useState<number | null>(null);
  const resetWizardToInitialState = React.useCallback(() => {
    setWizardData(() => createInitialWizardState());
  }, []);

  const handleModeChange = (value: WizardMode) => {
    if (value === mode) {
      return;
    }
    if (value === 'new') {
      setMode('new');
      setSelectedExistingCourseId(null);
      resetWizardToInitialState();
    } else {
      setMode('existing');
      resetWizardToInitialState();
    }
    setCurrentStep(0);
  };

  const hasInitializedFromQuery = React.useRef(false);

  const { data: turnosData, isLoading: isLoadingTurnos } = useQuery({
    queryKey: ['turnos'],
    queryFn: () => apiService.getTurnos(),
  });

  const { data: cursosResponse, isLoading: isLoadingCursos } = useQuery({
    queryKey: ['cursos', 'wizard-list'],
    queryFn: () => apiService.getCursos({ page: 1, limit: 100, sortBy: 'nome', sortOrder: 'asc' }),
  });

  const { data: existingCourseStructure, isFetching: isFetchingCourseStructure } = useQuery({
    queryKey: ['curso-structure', selectedExistingCourseId],
    queryFn: () => loadCourseStructure(selectedExistingCourseId as number),
    enabled: mode === 'existing' && !!selectedExistingCourseId,
    staleTime: 1000 * 60,
  });

  const availableTurnos = turnosData || [];
  const availableCourses = cursosResponse?.data || [];

  React.useEffect(() => {
    const cursoIdParam = searchParams.get('cursoId');
    if (!cursoIdParam) {
      return;
    }
    const parsedId = Number(cursoIdParam);
    if (!Number.isFinite(parsedId)) {
      return;
    }
    if (!hasInitializedFromQuery.current) {
      hasInitializedFromQuery.current = true;
      setMode('existing');
      setSelectedExistingCourseId(parsedId);
      setCurrentStep(0);
      return;
    }
    if (mode === 'existing' && selectedExistingCourseId !== parsedId) {
      setSelectedExistingCourseId(parsedId);
    }
  }, [mode, searchParams, selectedExistingCourseId]);

  React.useEffect(() => {
    if (mode !== 'existing') {
      return;
    }
    if (!existingCourseStructure) {
      return;
    }

    const { course, curriculos, periodos, disciplinas } = existingCourseStructure;
    const disciplinasByPeriodo = new Map<number, { disciplina: Disciplina; vinculo: DisciplinaPeriodo }[]>();
    for (const disciplina of disciplinas) {
      const vinculos = Array.isArray(disciplina.periodos) ? disciplina.periodos : [];
      for (const vinculo of vinculos) {
        const periodoId = Number(vinculo.periodoId);
        if (!Number.isFinite(periodoId)) {
          continue;
        }
        const list = disciplinasByPeriodo.get(periodoId) || [];
        list.push({ disciplina, vinculo });
        disciplinasByPeriodo.set(periodoId, list);
      }
    }

    const periodosByCurriculo = new Map<number, PeriodDraft[]>();
    const sortedPeriodos = [...periodos].sort((a, b) => Number(a.numero ?? 0) - Number(b.numero ?? 0));
    for (const periodo of sortedPeriodos) {
      const disciplinaDrafts = (disciplinasByPeriodo.get(periodo.id) || []).map(({ disciplina, vinculo }) => ({
        id: `disciplina-${disciplina.id}`,
        persistedId: disciplina.id,
        codigo: disciplina.codigo || '',
        nome: disciplina.nome || '',
        creditos:
          disciplina.creditos !== undefined && disciplina.creditos !== null
            ? String(disciplina.creditos)
            : '',
        cargaHoraria:
          disciplina.cargaHoraria !== undefined && disciplina.cargaHoraria !== null
            ? String(disciplina.cargaHoraria)
            : '',
        ementa: disciplina.ementa || '',
        bibliografia: disciplina.bibliografia || '',
        ordem:
          vinculo && vinculo.ordem !== undefined && vinculo.ordem !== null ? String(vinculo.ordem) : '',
        obrigatoria: vinculo ? vinculo.obrigatoria !== false : true,
      }));

      const periodDraft: PeriodDraft = {
        id: `periodo-${periodo.id}`,
        persistedId: periodo.id,
        numero: periodo.numero !== undefined && periodo.numero !== null ? String(periodo.numero) : '',
        nome: periodo.nome || '',
        descricao: periodo.descricao || '',
        disciplinas: disciplinaDrafts,
      };
      const bucket = periodosByCurriculo.get(periodo.curriculoId) || [];
      bucket.push(periodDraft);
      periodosByCurriculo.set(periodo.curriculoId, bucket);
    }

    const turnoDrafts: TurnoDraft[] = curriculos.map((curriculo) => {
      const periodList = periodosByCurriculo.get(curriculo.id) || [];
      return {
        turnoId: curriculo.turnoId,
        curriculoId: curriculo.id,
        versao: curriculo.versao || 'v1.0',
        vigenteDe: curriculo.vigenteDe || '',
        vigenteAte: curriculo.vigenteAte || '',
        ativo: Boolean(curriculo.ativo),
        isPersisted: true,
        periodos: periodList,
      };
    });

    const periodosCountPerTurno = turnoDrafts.map((turno) => turno.periodos.length);
    const defaultPeriodCount = periodosCountPerTurno.length > 0 ? Math.max(...periodosCountPerTurno) : 1;

    const orderedTurnos = turnoDrafts
      .map((turno) => ({
        ...turno,
        periodos: [...turno.periodos].sort(
          (a, b) => Number(a.numero || 0) - Number(b.numero || 0),
        ),
      }))
      .sort((a, b) => a.turnoId - b.turnoId);

    setWizardData({
      course: {
        id: course.id,
        nome: course.nome,
        grau: course.grau,
      },
      periodCount: defaultPeriodCount,
      turnos: orderedTurnos,
    });

  }, [existingCourseStructure, mode, searchParams, selectedExistingCourseId]);

  const finalizeWizardMutation = useMutation({
    mutationFn: async () => {
      const createdDisciplinas: number[] = [];
      const createdPeriodos: number[] = [];
      const createdCurriculos: number[] = [];
      let createdCursoId: number | undefined;

      const rollback = async () => {
        for (const disciplinaId of createdDisciplinas.reverse()) {
          try {
            await apiService.deleteDisciplina(disciplinaId);
          } catch {}
        }
        for (const periodoId of createdPeriodos.reverse()) {
          try {
            await apiService.deletePeriodo(periodoId);
          } catch {}
        }
        for (const curriculoId of createdCurriculos.reverse()) {
          try {
            await apiService.deleteCurriculo(curriculoId);
          } catch {}
        }
        if (createdCursoId) {
          try {
            await apiService.deleteCurso(createdCursoId);
          } catch {}
        }
      };

      try {
        if (mode === 'new') {
          const createdCurso = await apiService.createCurso({
            nome: wizardData.course.nome.trim(),
            grau: wizardData.course.grau,
          });
          createdCursoId = createdCurso.id;

          const disciplinaCodigoMap = new Map<string, number>();

          for (const turnoConfig of wizardData.turnos) {
            const curriculo = await apiService.createCurriculo({
              cursoId: createdCurso.id,
              turnoId: turnoConfig.turnoId,
              versao: turnoConfig.versao || 'v1.0',
              vigenteDe: turnoConfig.vigenteDe || undefined,
              vigenteAte: turnoConfig.vigenteAte || undefined,
              ativo: turnoConfig.ativo,
            });
            createdCurriculos.push(curriculo.id);

            for (let index = 0; index < turnoConfig.periodos.length; index++) {
              const periodo = turnoConfig.periodos[index];
              const numeroParsed = Number(periodo.numero);
              const fallbackNumero = index + 1;
              const numeroValue =
                Number.isFinite(numeroParsed) && numeroParsed > 0 ? Math.floor(numeroParsed) : fallbackNumero;

              const createdPeriodo = await apiService.createPeriodo({
                curriculoId: curriculo.id,
                numero: numeroValue,
                nome: periodo.nome || undefined,
                descricao: periodo.descricao || undefined,
              });
              createdPeriodos.push(createdPeriodo.id);

              const seenCodigos = new Set<string>();
              for (const disciplina of periodo.disciplinas) {
                const codigo = disciplina.codigo.trim();
                const nome = disciplina.nome.trim();
                const creditos = Number(disciplina.creditos);
                const cargaHoraria = Number(disciplina.cargaHoraria);

                if (!codigo || !nome || !Number.isFinite(creditos) || !Number.isFinite(cargaHoraria)) {
                  continue;
                }

                const codigoKey = codigo.toUpperCase();
                if (seenCodigos.has(codigoKey)) {
                  continue;
                }
                seenCodigos.add(codigoKey);

                let disciplinaId = disciplina.persistedId ?? disciplinaCodigoMap.get(codigoKey);

                if (!disciplinaId) {
                  const createdDisciplina = await apiService.createDisciplina({
                    cursoId: createdCurso.id,
                    codigo,
                    nome,
                    creditos,
                    cargaHoraria,
                    ementa: disciplina.ementa || undefined,
                    bibliografia: disciplina.bibliografia || undefined,
                    ativo: true,
                  });
                  disciplinaId = createdDisciplina.id;
                  disciplinaCodigoMap.set(codigoKey, disciplinaId);
                  createdDisciplinas.push(createdDisciplina.id);
                }

                if (!disciplinaId) {
                  continue;
                }

                const ordemParsed = Number(disciplina.ordem);
                const ordemValue = Number.isFinite(ordemParsed) && ordemParsed > 0 ? Math.floor(ordemParsed) : undefined;

                await apiService.addDisciplinaAoPeriodo(createdPeriodo.id, {
                  disciplinaId,
                  ordem: ordemValue,
                  obrigatoria: disciplina.obrigatoria !== false,
                });
              }
            }
          }

          return createdCurso.id;
        }

        if (!wizardData.course.id) {
          throw new Error('Selecione um curso existente para continuar a configuracao.');
        }

        const courseId = wizardData.course.id;
        const normalizedName = wizardData.course.nome.trim();
        const normalizedDegree = wizardData.course.grau.trim();

        if (!normalizedName || !normalizedDegree) {
          throw new Error('Nome e grau do curso sao obrigatorios.');
        }

        await apiService.updateCurso(courseId, {
          nome: normalizedName,
          grau: normalizedDegree,
        });

        // TODO: implementar edição (fora do escopo atual)
        return courseId;
      } catch (error) {
        await rollback();
        throw error;
      }
    },
    onSuccess: (cursoId) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curriculos'] });
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({
        title: 'Curso configurado',
        description:
          mode === 'new'
            ? 'Wizard concluido com sucesso. Curso pronto para uso.'
            : 'Estrutura do curso atualizada com sucesso.',
      });
      navigate(`/cursos/view/${cursoId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao finalizar wizard',
        description: error?.message || 'Nao foi possivel concluir a configuracao.',
        variant: 'destructive',
      });
    },
  });

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
    const requested = Number.isFinite(parsed) ? Math.max(1, Math.min(12, Math.floor(parsed))) : 1;

    setWizardData((prev) => {
      const maxPersisted = prev.turnos.reduce(
        (acc, turno) => Math.max(acc, turno.periodos.filter((periodo) => periodo.persistedId).length),
        0,
      );
      const periodCount = Math.max(requested, maxPersisted);
      return {
        ...prev,
        periodCount,
      };
    });
  };

  const toggleTurno = (turno: Turno) => {
    let removalBlocked = false;
    setWizardData((prev) => {
      const exists = prev.turnos.find((item) => item.turnoId === turno.id);
      if (exists) {
        if (exists.isPersisted) {
          removalBlocked = true;
          return prev;
        }
        return {
          ...prev,
          turnos: prev.turnos.filter((item) => item.turnoId !== turno.id),
        };
      }

      const draft: TurnoDraft = {
        turnoId: turno.id,
        curriculoId: undefined,
        versao: 'v1.0',
        vigenteDe: '',
        vigenteAte: '',
        ativo: true,
        isPersisted: false,
        periodos: buildPeriods(prev.periodCount),
      };

      return {
        ...prev,
        turnos: [...prev.turnos, draft].sort((a, b) => a.turnoId - b.turnoId),
      };
    });
    if (removalBlocked) {
      toast({
        title: 'Turno ja configurado',
        description: 'Para remover um turno existente, utilize a area de curriculos.',
        variant: 'destructive',
      });
    }
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

const addPeriod = (turnoId: number) => {
  setWizardData((prev) => ({
    ...prev,
    turnos: prev.turnos.map((turno) => {
      if (turno.turnoId !== turnoId) {
        return turno;
      }

      const highestNumero = turno.periodos.reduce((acc, periodo) => {
        const parsed = Number(periodo.numero);
        return Number.isFinite(parsed) ? Math.max(acc, parsed) : acc;
      }, 0);

      const nextNumero = highestNumero + 1;
      const newPeriod = emptyPeriod(nextNumero);

      return {
        ...turno,
        periodos: [...turno.periodos, newPeriod].sort(
          (a, b) => Number(a.numero || 0) - Number(b.numero || 0),
        ),
      };
    }),
  }));
};

const removePeriod = (turnoId: number, periodId: string) => {
  let removalBlocked: 'persisted' | 'min' | null = null;
  setWizardData((prev) => ({
    ...prev,
    turnos: prev.turnos.map((turno) => {
      if (turno.turnoId !== turnoId) {
        return turno;
      }

      if (turno.periodos.length <= 1) {
        removalBlocked = 'min';
        return turno;
      }

      const target = turno.periodos.find((periodo) => periodo.id === periodId);
      if (target?.persistedId) {
        removalBlocked = 'persisted';
        return turno;
      }

      return {
        ...turno,
        periodos: turno.periodos.filter((periodo) => periodo.id !== periodId),
      };
    }),
  }));

  if (removalBlocked === 'persisted') {
    toast({
      title: 'Periodo existente',
      description: 'Remova periodos ja cadastrados na tela de periodos.',
      variant: 'destructive',
    });
  }

  if (removalBlocked === 'min') {
    toast({
      title: 'Estrutura invalida',
      description: 'Cada turno precisa manter pelo menos um periodo configurado.',
      variant: 'destructive',
    });
  }
};

  const addDiscipline = (turnoId: number, periodId: string) => {
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
    value: string | boolean,
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
    let removalBlocked = false;
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
            const target = periodo.disciplinas.find((disciplina) => disciplina.id === disciplineId);
            if (target?.persistedId) {
              removalBlocked = true;
              return periodo;
            }
            return {
              ...periodo,
              disciplinas: periodo.disciplinas.filter((disciplina) => disciplina.id !== disciplineId),
            };
          }),
        };
      }),
    }));
    if (removalBlocked) {
      toast({
        title: 'Disciplina existente',
        description: 'Remova disciplinas ja cadastradas pela tela de disciplinas.',
        variant: 'destructive',
      });
    }
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

const hasInvalidPeriod = wizardData.turnos.some(
  (turno) =>
    turno.periodos.length === 0 ||
    turno.periodos.some((periodo) => !isPositiveNumber(periodo.numero)),
);

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        if (mode === 'existing') {
          return (
            Boolean(selectedExistingCourseId && wizardData.course.id) &&
            wizardData.course.nome.trim().length >= 2 &&
            wizardData.course.grau.trim().length > 0 &&
            !isFetchingCourseStructure
          );
        }
        return (
          wizardData.course.nome.trim().length >= 2 && wizardData.course.grau.trim().length > 0
        );
      case 1:
        return wizardData.periodCount > 0;
      case 2:
        return wizardData.turnos.length > 0;
      case 3:
    return !hasIncompleteDiscipline && !hasInvalidPeriod;
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

  if (hasInvalidPeriod) {
    toast({
      title: 'Periodos invalidos',
      description: 'Verifique se cada turno possui ao menos um periodo e se os numeros sao validos.',
      variant: 'destructive',
    });
    return;
  }

    if (mode === 'existing' && (!selectedExistingCourseId || isFetchingCourseStructure)) {
      toast({
        title: 'Selecione um curso',
        description: 'Escolha um curso existente e aguarde o carregamento para continuar.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await finalizeWizardMutation.mutateAsync();
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
              <CardDescription>Informe os dados do curso ou continue a partir de um curso existente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Como deseja prosseguir?</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className={`flex items-center gap-2 text-sm font-medium ${mode === 'new' ? 'text-blue-600' : 'text-gray-600'}`}>
                    <input
                      type="radio"
                      name="wizard-mode"
                      value="new"
                      checked={mode === 'new'}
                      onChange={() => handleModeChange('new')}
                    />
                    Criar novo curso
                  </label>
                  <label className={`flex items-center gap-2 text-sm font-medium ${mode === 'existing' ? 'text-blue-600' : 'text-gray-600'}`}>
                    <input
                      type="radio"
                      name="wizard-mode"
                      value="existing"
                      checked={mode === 'existing'}
                      onChange={() => handleModeChange('existing')}
                    />
                    Continuar curso existente
                  </label>
                </div>
                <p className="text-xs text-gray-500">Escolha a opcao desejada para configurar o curso.</p>
              </div>

              {mode === 'existing' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                    {isLoadingCursos ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando cursos...
                      </div>
                    ) : (
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedExistingCourseId ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          const nextId = value ? Number(value) : null;
                          if (!nextId) {
                            setSelectedExistingCourseId(null);
                            resetWizardToInitialState();
                            return;
                          }
                          setSelectedExistingCourseId(nextId);
                          setWizardData(() => ({
                            ...createInitialWizardState(),
                            course: { id: nextId, nome: '', grau: '' },
                          }));
                          setCurrentStep(0);
                        }}
                      >
                        <option value="">Selecione o curso...</option>
                        {availableCourses.map((curso) => (
                          <option key={curso.id} value={curso.id}>
                            {curso.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {selectedExistingCourseId ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {isFetchingCourseStructure ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando estrutura do curso...
                        </>
                      ) : (
                        <span>
                          Estrutura carregada. Ajuste os dados para adicionar novos turnos, periodos e disciplinas.
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              <div>
                <label htmlFor="wizard-course-name" className="block text-sm font-medium text-gray-700 mb-1">Nome do curso *</label>
                <Input
                  id="wizard-course-name"
                  value={wizardData.course.nome}
                  onChange={(event) => updateCourseField('nome', event.target.value)}
                  placeholder="Ex: Bacharel em Teologia"
                  disabled={mode === 'existing' && (!wizardData.course.id || isFetchingCourseStructure)}
                />
              </div>
              <div>
                <label htmlFor="wizard-course-degree" className="block text-sm font-medium text-gray-700 mb-1">Grau *</label>
                <select
                  id="wizard-course-degree"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={wizardData.course.grau}
                  onChange={(event) => updateCourseField('grau', event.target.value)}
                  disabled={mode === 'existing' && (!wizardData.course.id || isFetchingCourseStructure)}
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
              <CardDescription>Defina o numero padrao de periodos para novos turnos. Voce podera ajustar cada turno individualmente depois.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="wizard-period-count" className="block text-sm font-medium text-gray-700 mb-1">Quantidade de periodos *</label>
                <Input
                  id="wizard-period-count"
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
                      {turno.periodos.map((periodo) => {
                        const numeroFieldId = `periodo-${periodo.id}-numero` as const;
                        const nomeFieldId = `periodo-${periodo.id}-nome` as const;
                        const descricaoFieldId = `periodo-${periodo.id}-descricao` as const;
                        const removalDisabledReason = periodo.persistedId
                          ? 'persisted'
                          : turno.periodos.length <= 1
                          ? 'min'
                          : null;
                        const canRemovePeriod = removalDisabledReason === null;
                        const removalTitle = removalDisabledReason === 'persisted'
                          ? 'Remova periodos existentes pela tela de periodos.'
                          : removalDisabledReason === 'min'
                            ? 'Mantenha pelo menos um periodo por turno.'
                            : 'Remover periodo';

                        return (
                          <div key={periodo.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                            <div className="space-y-3">
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                <div className="flex flex-col gap-1">
                                  <h4 className="text-sm font-semibold text-gray-800">Configuracao do periodo</h4>
                                  <p className="text-xs text-gray-500">Cadastre as disciplinas que compoem este periodo no turno selecionado.</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePeriod(turno.turnoId, periodo.id)}
                                  disabled={!canRemovePeriod}
                                  className={`text-red-600 hover:text-red-700 ${!canRemovePeriod ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={removalTitle}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Remover periodo
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3">
                                <div>
                                  <label htmlFor={numeroFieldId} className="block text-xs font-medium text-gray-600 mb-1">Numero *</label>
                                  <Input
                                    id={numeroFieldId}
                                    type="number"
                                    min={1}
                                    value={periodo.numero}
                                    onChange={(event) => updatePeriodField(turno.turnoId, periodo.id, 'numero', event.target.value)}
                                    placeholder="Ex: 1"
                                  />
                                  <p className="text-[11px] text-gray-500 mt-1">E permitido repetir numeros conforme necessario.</p>
                                </div>
                                <div>
                                  <label htmlFor={nomeFieldId} className="block text-xs font-medium text-gray-600 mb-1">Nome opcional</label>
                                  <Input
                                    id={nomeFieldId}
                                    value={periodo.nome}
                                    onChange={(event) => updatePeriodField(turno.turnoId, periodo.id, 'nome', event.target.value)}
                                    placeholder="Nome do periodo (opcional)"
                                  />
                                </div>
                              </div>
                            </div>
                            <Textarea
                              id={descricaoFieldId}
                              value={periodo.descricao}
                              onChange={(event) => updatePeriodField(turno.turnoId, periodo.id, 'descricao', event.target.value)}
                              placeholder="Descricao opcional do periodo"
                            />
                            <div className="space-y-3">
                              {periodo.disciplinas.length === 0 && (
                                <p className="text-xs text-gray-500">Nenhuma disciplina adicionada ainda.</p>
                              )}
                              {periodo.disciplinas.map((disciplina) => {
                                const disciplinaPrefix = `disciplina-${disciplina.id}` as const;
                                const disciplinaCodigoFieldId = `${disciplinaPrefix}-codigo`;
                                const disciplinaNomeFieldId = `${disciplinaPrefix}-nome`;
                                const disciplinaCreditosFieldId = `${disciplinaPrefix}-creditos`;
                                const disciplinaCargaFieldId = `${disciplinaPrefix}-carga`;

                                return (
                                  <div key={disciplina.id} className="border border-dashed border-gray-300 rounded-md p-4 space-y-3 bg-gray-50">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                      <h5 className="text-sm font-medium text-gray-700">Disciplina</h5>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeDiscipline(turno.turnoId, periodo.id, disciplina.id)}
                                        className={`text-red-600 hover:text-red-700 ${disciplina.persistedId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={Boolean(disciplina.persistedId)}
                                        title={disciplina.persistedId ? 'Remova disciplinas existentes na tela de disciplinas.' : 'Remover disciplina'}
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" /> Remover
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                      <div>
                                        <label htmlFor={disciplinaCodigoFieldId} className="block text-xs font-medium text-gray-600 mb-1">Codigo *</label>
                                        <Input
                                          id={disciplinaCodigoFieldId}
                                          value={disciplina.codigo}
                                          onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'codigo', event.target.value)}
                                          placeholder="Ex: DISC101"
                                        />
                                      </div>
                                      <div>
                                        <label htmlFor={disciplinaNomeFieldId} className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                                        <Input
                                          id={disciplinaNomeFieldId}
                                          value={disciplina.nome}
                                          onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'nome', event.target.value)}
                                          placeholder="Nome da disciplina"
                                        />
                                      </div>
                                      <div>
                                        <label htmlFor={`${disciplinaPrefix}-ordem`} className="block text-xs font-medium text-gray-600 mb-1">Ordem</label>
                                        <Input
                                          id={`${disciplinaPrefix}-ordem`}
                                          type="number"
                                          min={1}
                                          value={disciplina.ordem}
                                          onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'ordem', event.target.value)}
                                          placeholder="Ex: 1"
                                        />
                                        <p className="text-[11px] text-gray-500 mt-1">Opcional. Use para definir a sequencia da disciplina.</p>
                                      </div>
                                      <div className="flex items-center gap-2 pt-6 md:pt-0">
                                        <input
                                          id={`${disciplinaPrefix}-obrigatoria`}
                                          type="checkbox"
                                          className="h-4 w-4"
                                          checked={disciplina.obrigatoria}
                                          onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'obrigatoria', event.target.checked)}
                                        />
                                        <label htmlFor={`${disciplinaPrefix}-obrigatoria`} className="text-xs text-gray-600">Disciplina obrigatoria</label>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label htmlFor={disciplinaCreditosFieldId} className="block text-xs font-medium text-gray-600 mb-1">Creditos *</label>
                                        <Input
                                          id={disciplinaCreditosFieldId}
                                          type="number"
                                          min={1}
                                          value={disciplina.creditos}
                                          onChange={(event) => updateDisciplineField(turno.turnoId, periodo.id, disciplina.id, 'creditos', event.target.value)}
                                          placeholder="Ex: 4"
                                        />
                                      </div>
                                      <div>
                                        <label htmlFor={disciplinaCargaFieldId} className="block text-xs font-medium text-gray-600 mb-1">Carga horaria (horas) *</label>
                                        <Input
                                          id={disciplinaCargaFieldId}
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
                                );
                              })}
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
                        );
                      })}
                      <div className="flex justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={() => addPeriod(turno.turnoId)}>
                          <Plus className="h-4 w-4 mr-2" /> Adicionar periodo
                        </Button>
                      </div>
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
                <p><strong>Periodos padrao (novos turnos):</strong> {wizardData.periodCount}</p>
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
                                <span className="ml-2 text-[11px] text-gray-500 uppercase tracking-wide">
                                  {disciplina.obrigatoria ? 'Obrigatoria' : 'Optativa'}
                                  {disciplina.ordem ? ` • Ordem ${disciplina.ordem}` : ''}
                                </span>
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



















