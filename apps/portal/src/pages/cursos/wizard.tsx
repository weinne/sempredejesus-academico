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
import { DatePicker } from '@/components/ui/date-picker';
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
  X,
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
  isLinkedFromExisting?: boolean;
  expanded?: boolean;
}

interface PeriodDraft {
  id: string;
  persistedId?: number;
  numero: string;
  nome: string;
  descricao: string;
  disciplinas: DisciplineDraft[];
}

interface CurriculoDraft {
  id: string;
  curriculoId?: number;
  turnoId: number;
  versao: string;
  vigenteDe: string;
  vigenteAte: string;
  ativo: boolean;
  isPersisted?: boolean;
  periodos: PeriodDraft[];
}

interface TurnoDraft {
  turnoId: number;
  curriculos: CurriculoDraft[];
}

interface WizardState {
  course: {
    id?: number;
    nome: string;
    grau: string;
  };
  turnos: TurnoDraft[];
}

type WizardMode = 'new' | 'existing';

const DEFAULT_PERIOD_COUNT = 4;
const MAX_PERIOD_COUNT = 12;

const createInitialWizardState = (): WizardState => ({
  course: {
    id: undefined,
    nome: '',
    grau: '',
  },
  turnos: [],
});

const steps = [
  { id: 0, label: 'Curso' },
  { id: 1, label: 'Turnos e curriculos' },
  { id: 2, label: 'Periodos e disciplinas' },
  { id: 3, label: 'Resumo' },
];

// Palavras que devem ser ignoradas ao gerar siglas
const IGNORED_WORDS = new Set(['em', 'de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'para', 'com', 'por']);

/**
 * Gera uma sigla a partir de um texto, pegando a primeira letra de cada palavra significativa
 */
const generateAcronym = (text: string): string => {
  if (!text || !text.trim()) return '';
  
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0 && !IGNORED_WORDS.has(word.toLowerCase()));
  
  if (words.length === 0) return '';
  
  // Se tiver apenas uma palavra, pega a primeira letra
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  // Se tiver múltiplas palavras, pega a primeira letra de cada uma (máximo 3 letras)
  return words
    .slice(0, 3)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

/**
 * Gera o nome do período com sigla baseada no curso e turno
 */
const generatePeriodName = (cursoNome: string, turnoNome: string, numero: number): string => {
  const cursoSigla = generateAcronym(cursoNome);
  const turnoSigla = generateAcronym(turnoNome);
  
  if (!cursoSigla && !turnoSigla) {
    return `Periodo ${numero}`;
  }
  
  const sigla = cursoSigla && turnoSigla 
    ? `${cursoSigla}${turnoSigla}` 
    : cursoSigla || turnoSigla;
  
  // Formata o número como ordinal (1ª, 2ª, 3ª, etc.)
  const ordinal = numero === 1 ? '1ª' : `${numero}ª`;
  
  return `${sigla} - ${ordinal} Período`;
};

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
  isLinkedFromExisting: false,
  expanded: true,
});

const emptyPeriod = (numero: number, cursoNome?: string, turnoNome?: string): PeriodDraft => ({
  id: Math.random().toString(36).slice(2),
  persistedId: undefined,
  numero: numero.toString(),
  nome: cursoNome && turnoNome 
    ? generatePeriodName(cursoNome, turnoNome, numero)
    : `Periodo ${numero}`,
  descricao: '',
  disciplinas: [],
});

const buildPeriods = (count: number, cursoNome?: string, turnoNome?: string): PeriodDraft[] =>
  Array.from({ length: count }, (_, index) => emptyPeriod(index + 1, cursoNome, turnoNome));

const createCurriculoDraft = (
  turnoId: number,
  overrides: Partial<CurriculoDraft> = {},
  cursoNome?: string,
  turnoNome?: string,
): CurriculoDraft => ({
  id: overrides.id ?? Math.random().toString(36).slice(2),
  curriculoId: overrides.curriculoId,
  turnoId,
  versao: overrides.versao ?? 'v1.0',
  vigenteDe: overrides.vigenteDe ?? '',
  vigenteAte: overrides.vigenteAte ?? '',
  ativo: overrides.ativo ?? true,
  isPersisted: overrides.isPersisted ?? false,
  periodos: overrides.periodos
    ? [...overrides.periodos].sort((a, b) => Number(a.numero || 0) - Number(b.numero || 0))
    : buildPeriods(DEFAULT_PERIOD_COUNT, cursoNome, turnoNome),
});

const isPositiveNumber = (value: string): boolean => {
  if (!value) {
    return false;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const cloneDisciplineDraft = (disciplina: DisciplineDraft): DisciplineDraft => ({
  ...disciplina,
  id: Math.random().toString(36).slice(2),
  persistedId: disciplina.persistedId,
  isLinkedFromExisting: true,
  expanded: false,
});

const buildDisciplineKey = (disciplina: DisciplineDraft): string => {
  if (disciplina.persistedId) {
    return `persisted-${disciplina.persistedId}`;
  }
  const normalizedCodigo = disciplina.codigo.trim().toUpperCase();
  if (normalizedCodigo) {
    return `codigo-${normalizedCodigo}`;
  }
  return `draft-${disciplina.id}`;
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
  const [existingDisciplineSelections, setExistingDisciplineSelections] = React.useState<Record<string, string>>({});

  const [mode, setMode] = React.useState<WizardMode>('new');
  const [selectedExistingCourseId, setSelectedExistingCourseId] = React.useState<number | null>(null);
  const [isCreateTurnoModalOpen, setIsCreateTurnoModalOpen] = React.useState(false);
  const [newTurnoNome, setNewTurnoNome] = React.useState('');
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

  const createTurnoMutation = useMutation({
    mutationFn: (payload: { nome: string }) => apiService.createTurno(payload),
    onSuccess: async (newTurno) => {
      // Atualizar o cache imediatamente
      queryClient.setQueryData<Turno[]>(['turnos'], (oldData = []) => {
        // Verificar se o turno já existe para evitar duplicatas
        if (oldData.some((t) => t.id === newTurno.id)) {
          return oldData;
        }
        return [...oldData, newTurno].sort((a, b) => a.id - b.id);
      });
      
      toast({
        title: 'Turno criado',
        description: `Turno "${newTurno.nome}" criado com sucesso!`,
      });
      setIsCreateTurnoModalOpen(false);
      setNewTurnoNome('');
      
      // Selecionar automaticamente o novo turno após um pequeno delay
      // para garantir que o estado foi atualizado
      setTimeout(() => {
        const turno: Turno = { id: newTurno.id, nome: newTurno.nome };
        toggleTurno(turno);
      }, 100);
      
      // Invalidar a query para garantir sincronização com o servidor
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar turno',
        description: error?.message || 'Não foi possível criar o turno.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTurno = () => {
    const nome = newTurnoNome.trim();
    if (!nome || nome.length < 2) {
      toast({
        title: 'Nome inválido',
        description: 'O nome do turno deve ter pelo menos 2 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    createTurnoMutation.mutate({ nome });
  };

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
        isLinkedFromExisting: true,
        expanded: false,
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

    const curriculosByTurno = new Map<number, CurriculoDraft[]>();
    for (const curriculo of curriculos) {
      const periodList = periodosByCurriculo.get(curriculo.id) || [];
      const curriculoDraft = createCurriculoDraft(curriculo.turnoId, {
        id: `curriculo-${curriculo.id}`,
        curriculoId: curriculo.id,
        versao: curriculo.versao || 'v1.0',
        vigenteDe: curriculo.vigenteDe || '',
        vigenteAte: curriculo.vigenteAte || '',
        ativo: Boolean(curriculo.ativo),
        isPersisted: true,
        periodos: periodList,
      });
      const bucket = curriculosByTurno.get(curriculo.turnoId) || [];
      bucket.push(curriculoDraft);
      curriculosByTurno.set(curriculo.turnoId, bucket);
    }

    const orderedTurnos: TurnoDraft[] = Array.from(curriculosByTurno.entries())
      .map(([turnoId, curriculosList]) => ({
        turnoId,
        curriculos: curriculosList.sort((a, b) => (a.versao || '').localeCompare(b.versao || '')),
      }))
      .sort((a, b) => a.turnoId - b.turnoId);

    setWizardData({
      course: {
        id: course.id,
        nome: course.nome,
        grau: course.grau,
      },
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
            for (const curriculoDraft of turnoConfig.curriculos) {
              const curriculo = await apiService.createCurriculo({
                cursoId: createdCurso.id,
                turnoId: turnoConfig.turnoId,
                versao: curriculoDraft.versao || 'v1.0',
                vigenteDe: curriculoDraft.vigenteDe || undefined,
                vigenteAte: curriculoDraft.vigenteAte || undefined,
                ativo: curriculoDraft.ativo,
              });
              createdCurriculos.push(curriculo.id);

              for (let index = 0; index < curriculoDraft.periodos.length; index++) {
                const periodo = curriculoDraft.periodos[index];
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

  const toggleTurno = (turno: Turno) => {
    let removalBlocked = false;
    setWizardData((prev) => {
      const exists = prev.turnos.find((item) => item.turnoId === turno.id);
      if (exists) {
        const hasPersistedCurriculo = exists.curriculos.some((curriculo) => curriculo.isPersisted);
        if (hasPersistedCurriculo) {
          removalBlocked = true;
          return prev;
        }
        return {
          ...prev,
          turnos: prev.turnos.filter((item) => item.turnoId !== turno.id),
        };
      }

      const cursoNome = prev.course.nome.trim() || undefined;
      const turnoNome = turno.nome || undefined;
      const draft: TurnoDraft = {
        turnoId: turno.id,
        curriculos: [createCurriculoDraft(turno.id, {}, cursoNome, turnoNome)],
      };

      return {
        ...prev,
        turnos: [...prev.turnos, draft].sort((a, b) => a.turnoId - b.turnoId),
      };
    });
    if (removalBlocked) {
      toast({
        title: 'Turno ja configurado',
        description: 'Remova ou ajuste curriculos existentes na etapa de curriculos antes de desabilitar o turno.',
        variant: 'destructive',
      });
    }
  };


const updatePeriodField = (
  turnoId: number,
  curriculoDraftId: string,
  periodId: string,
  field: keyof PeriodDraft,
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
        curriculos: turno.curriculos.map((curriculo) => {
          if (curriculo.id !== curriculoDraftId) {
            return curriculo;
          }
          return {
            ...curriculo,
            periodos: curriculo.periodos.map((periodo) =>
              periodo.id === periodId
                ? {
                    ...periodo,
                    [field]: value,
                  }
                : periodo,
            ),
          };
        }),
      };
    }),
  }));
};

const addPeriod = (turnoId: number, curriculoDraftId: string) => {
  let limitReached = false;
  setWizardData((prev) => {
    const cursoNome = prev.course.nome.trim() || undefined;
    const turnoInfo = availableTurnos.find((t) => t.id === turnoId);
    const turnoNome = turnoInfo?.nome || undefined;
    
    return {
      ...prev,
      turnos: prev.turnos.map((turno) => {
        if (turno.turnoId !== turnoId) {
          return turno;
        }
        return {
          ...turno,
          curriculos: turno.curriculos.map((curriculo) => {
            if (curriculo.id !== curriculoDraftId) {
              return curriculo;
            }
            if (curriculo.periodos.length >= MAX_PERIOD_COUNT) {
              limitReached = true;
              return curriculo;
            }
            // Usar a quantidade de períodos + 1 para garantir sequência correta
            // Se não há períodos, começa do 1
            const nextNumero = curriculo.periodos.length === 0 ? 1 : curriculo.periodos.length + 1;
            const newPeriod = emptyPeriod(nextNumero, cursoNome, turnoNome);
            return {
              ...curriculo,
              periodos: [...curriculo.periodos, newPeriod].sort(
                (a, b) => Number(a.numero || 0) - Number(b.numero || 0),
              ),
            };
          }),
        };
      }),
    };
  });
  if (limitReached) {
    toast({
      title: 'Limite de periodos',
      description: `Cada curriculo pode ter no maximo ${MAX_PERIOD_COUNT} periodos.`,
      variant: 'destructive',
    });
  }
};

const addCurriculo = (turnoId: number) => {
  setWizardData((prev) => {
    const cursoNome = prev.course.nome.trim() || undefined;
    const turnoInfo = availableTurnos.find((t) => t.id === turnoId);
    const turnoNome = turnoInfo?.nome || undefined;
    
    return {
      ...prev,
      turnos: prev.turnos.map((turno) =>
        turno.turnoId === turnoId
          ? {
              ...turno,
              curriculos: [...turno.curriculos, createCurriculoDraft(turnoId, {}, cursoNome, turnoNome)],
            }
          : turno,
      ),
    };
  });
};

const removeCurriculo = (turnoId: number, curriculoDraftId: string) => {
  let removalBlocked: 'persisted' | 'min' | null = null;
  setWizardData((prev) => ({
    ...prev,
    turnos: prev.turnos.map((turno) => {
      if (turno.turnoId !== turnoId) {
        return turno;
      }
      if (turno.curriculos.length <= 1) {
        removalBlocked = 'min';
        return turno;
      }
      const target = turno.curriculos.find((curriculo) => curriculo.id === curriculoDraftId);
      if (target?.isPersisted) {
        removalBlocked = 'persisted';
        return turno;
      }
      return {
        ...turno,
        curriculos: turno.curriculos.filter((curriculo) => curriculo.id !== curriculoDraftId),
      };
    }),
  }));
  if (removalBlocked === 'persisted') {
    toast({
      title: 'Curriculo existente',
      description: 'Remova curriculos ja cadastrados pela tela de curriculos.',
      variant: 'destructive',
    });
  }
  if (removalBlocked === 'min') {
    toast({
      title: 'Estrutura invalida',
      description: 'Cada turno selecionado precisa ter pelo menos um curriculo configurado.',
      variant: 'destructive',
    });
  }
};

const updateCurriculoField = (
  turnoId: number,
  curriculoDraftId: string,
  field: keyof Pick<CurriculoDraft, 'versao' | 'vigenteDe' | 'vigenteAte' | 'ativo'>,
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
        curriculos: turno.curriculos.map((curriculo) =>
          curriculo.id === curriculoDraftId
            ? {
                ...curriculo,
                [field]: value,
              }
            : curriculo,
        ),
      };
    }),
  }));
};

const updateCurriculoPeriodCount = (turnoId: number, curriculoDraftId: string, value: string) => {
  const parsed = Number(value);
  const desired = Number.isFinite(parsed) ? Math.max(1, Math.min(MAX_PERIOD_COUNT, Math.floor(parsed))) : 1;
  let shrinkBlocked = false;
  setWizardData((prev) => {
    const cursoNome = prev.course.nome.trim() || undefined;
    const turnoInfo = availableTurnos.find((t) => t.id === turnoId);
    const turnoNome = turnoInfo?.nome || undefined;
    
    return {
      ...prev,
      turnos: prev.turnos.map((turno) => {
        if (turno.turnoId !== turnoId) {
          return turno;
        }
        return {
          ...turno,
          curriculos: turno.curriculos.map((curriculo) => {
            if (curriculo.id !== curriculoDraftId) {
              return curriculo;
            }
            const persisted = curriculo.periodos.filter((periodo) => periodo.persistedId).length;
            if (persisted > desired) {
              shrinkBlocked = true;
              return curriculo;
            }
            let periodos = curriculo.periodos;
            if (desired > periodos.length) {
              // Calcular o próximo número baseado na quantidade de períodos existentes
              // Se não há períodos, começa do 1. Caso contrário, continua a sequência
              const nextNumero = periodos.length === 0 ? 1 : periodos.length + 1;
              const additions = Array.from({ length: desired - periodos.length }, (_, index) =>
                emptyPeriod(nextNumero + index, cursoNome, turnoNome),
              );
              periodos = [...periodos, ...additions];
            } else if (desired < periodos.length) {
              const removable = periodos.filter((periodo) => !periodo.persistedId);
              const toRemove = periodos.length - desired;
              if (removable.length < toRemove) {
                shrinkBlocked = true;
                return curriculo;
              }
              const removableIds = new Set(removable.slice(0, toRemove).map((periodo) => periodo.id));
              periodos = periodos.filter((periodo) => !removableIds.has(periodo.id));
            }
            return {
              ...curriculo,
              periodos: [...periodos].sort((a, b) => Number(a.numero || 0) - Number(b.numero || 0)),
            };
          }),
        };
      }),
    };
  });
  if (shrinkBlocked) {
    toast({
      title: 'Periodos existentes',
      description: 'Nao e possivel reduzir a quantidade abaixo dos periodos ja cadastrados.',
      variant: 'destructive',
    });
  }
};

const removePeriod = (turnoId: number, curriculoDraftId: string, periodId: string) => {
  let removalBlocked: 'persisted' | 'min' | null = null;
  setWizardData((prev) => ({
    ...prev,
    turnos: prev.turnos.map((turno) => {
      if (turno.turnoId !== turnoId) {
        return turno;
      }
      return {
        ...turno,
        curriculos: turno.curriculos.map((curriculo) => {
          if (curriculo.id !== curriculoDraftId) {
            return curriculo;
          }
          if (curriculo.periodos.length <= 1) {
            removalBlocked = 'min';
            return curriculo;
          }
          const target = curriculo.periodos.find((periodo) => periodo.id === periodId);
          if (target?.persistedId) {
            removalBlocked = 'persisted';
            return curriculo;
          }
          return {
            ...curriculo,
            periodos: curriculo.periodos.filter((periodo) => periodo.id !== periodId),
          };
        }),
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
      description: 'Cada curriculo precisa manter pelo menos um periodo configurado.',
      variant: 'destructive',
    });
  }
};

const addDiscipline = (turnoId: number, curriculoDraftId: string, periodId: string, base?: DisciplineDraft) => {
  setWizardData((prev) => ({
    ...prev,
    turnos: prev.turnos.map((turno) => {
      if (turno.turnoId !== turnoId) {
        return turno;
      }
      return {
        ...turno,
        curriculos: turno.curriculos.map((curriculo) => {
          if (curriculo.id !== curriculoDraftId) {
            return curriculo;
          }
          return {
            ...curriculo,
            periodos: curriculo.periodos.map((periodo) =>
              periodo.id === periodId
                ? {
                    ...periodo,
                    disciplinas: [
                      ...periodo.disciplinas,
                      base ? cloneDisciplineDraft(base) : emptyDiscipline(),
                    ],
                  }
                : periodo,
            ),
          };
        }),
      };
    }),
  }));
};

const updateDisciplineField = (
  turnoId: number,
  curriculoDraftId: string,
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
        curriculos: turno.curriculos.map((curriculo) => {
          if (curriculo.id !== curriculoDraftId) {
            return curriculo;
          }
          return {
            ...curriculo,
            periodos: curriculo.periodos.map((periodo) => {
              if (periodo.id !== periodId) {
                return periodo;
              }
              return {
                ...periodo,
                disciplinas: periodo.disciplinas.map((disciplina) =>
                  disciplina.id === disciplineId
                    ? {
                        ...disciplina,
                        [field]: value,
                      }
                    : disciplina,
                ),
              };
            }),
          };
        }),
      };
    }),
  }));
};

const removeDiscipline = (
  turnoId: number,
  curriculoDraftId: string,
  periodId: string,
  disciplineId: string,
) => {
  let removalBlocked = false;
  setWizardData((prev) => ({
    ...prev,
    turnos: prev.turnos.map((turno) => {
      if (turno.turnoId !== turnoId) {
        return turno;
      }
      return {
        ...turno,
        curriculos: turno.curriculos.map((curriculo) => {
          if (curriculo.id !== curriculoDraftId) {
            return curriculo;
          }
          return {
            ...curriculo,
            periodos: curriculo.periodos.map((periodo) => {
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

const toggleDisciplineExpanded = (
  turnoId: number,
  curriculoDraftId: string,
  periodId: string,
  disciplineId: string,
) => {
  setWizardData((prev) => ({
    ...prev,
    turnos: prev.turnos.map((turno) => {
      if (turno.turnoId !== turnoId) {
        return turno;
      }
      return {
        ...turno,
        curriculos: turno.curriculos.map((curriculo) => {
          if (curriculo.id !== curriculoDraftId) {
            return curriculo;
          }
          return {
            ...curriculo,
            periodos: curriculo.periodos.map((periodo) => {
              if (periodo.id !== periodId) {
                return periodo;
              }
              return {
                ...periodo,
                disciplinas: periodo.disciplinas.map((disciplina) =>
                  disciplina.id === disciplineId
                    ? {
                        ...disciplina,
                        expanded: !disciplina.expanded,
                      }
                    : disciplina,
                ),
              };
            }),
          };
        }),
      };
    }),
  }));
};

const allCurriculos = React.useMemo(() => wizardData.turnos.flatMap((turno) => turno.curriculos), [wizardData.turnos]);

const disciplineCatalog = React.useMemo(() => {
  const map = new Map<string, DisciplineDraft>();
  wizardData.turnos.forEach((turno) => {
    turno.curriculos.forEach((curriculo) => {
      curriculo.periodos.forEach((periodo) => {
        periodo.disciplinas.forEach((disciplina) => {
          const codigo = disciplina.codigo.trim();
          const nome = disciplina.nome.trim();
          if (!codigo || !nome || !isPositiveNumber(disciplina.creditos) || !isPositiveNumber(disciplina.cargaHoraria)) {
            return;
          }
          const key = buildDisciplineKey(disciplina);
          if (!map.has(key)) {
            map.set(key, disciplina);
          }
        });
      });
    });
  });
  return map;
}, [wizardData.turnos]);

const totalCurriculos = allCurriculos.length;

const disciplineOptions = React.useMemo(
  () =>
    Array.from(disciplineCatalog.entries()).map(([key, disciplina]) => ({
      key,
      label: `${disciplina.codigo} • ${disciplina.nome}`,
    })),
  [disciplineCatalog],
);

const hasIncompleteDiscipline = allCurriculos.some((curriculo) =>
  curriculo.periodos.some((periodo) =>
    periodo.disciplinas.some(
      (disciplina) =>
        !disciplina.nome.trim() ||
        !disciplina.codigo.trim() ||
        !isPositiveNumber(disciplina.creditos) ||
        !isPositiveNumber(disciplina.cargaHoraria),
    ),
  ),
);

const hasInvalidPeriod = allCurriculos.some(
  (curriculo) =>
    curriculo.periodos.length === 0 ||
    curriculo.periodos.some((periodo) => !isPositiveNumber(periodo.numero)),
);

const handleExistingDisciplineSelection = (periodId: string, optionKey: string) => {
  setExistingDisciplineSelections((prev) => ({
    ...prev,
    [periodId]: optionKey,
  }));
};

const attachExistingDisciplineToPeriod = (turnoId: number, curriculoDraftId: string, periodId: string) => {
  const selectedKey = existingDisciplineSelections[periodId];
  if (!selectedKey) {
    return;
  }
  const disciplina = disciplineCatalog.get(selectedKey);
  if (!disciplina) {
    return;
  }
  addDiscipline(turnoId, curriculoDraftId, periodId, disciplina);
  setExistingDisciplineSelections((prev) => ({
    ...prev,
    [periodId]: '',
  }));
};

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
        return (
          wizardData.turnos.length > 0 &&
          totalCurriculos > 0 &&
          allCurriculos.every((curriculo) => curriculo.periodos.length > 0)
        );
      case 2:
        return totalCurriculos > 0 && !hasIncompleteDiscipline && !hasInvalidPeriod;
      case 3:
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
      description: 'Verifique se cada curriculo possui ao menos um periodo e se os numeros sao validos.',
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
              <CardTitle>Turnos e curriculos</CardTitle>
              <CardDescription>Selecione os turnos ofertados e configure os curriculos de cada turno antes de definir os periodos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {availableTurnos.length === 0
                      ? 'Nenhum turno cadastrado ainda.'
                      : `${availableTurnos.length} turno(s) disponível(is).`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateTurnoModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Criar novo turno
                </Button>
              </div>
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
                          <div className="p-4 space-y-4 bg-white">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Curriculos deste turno</p>
                                <p className="text-xs text-gray-500">Informe versao, vigencia e quantidade de periodos para cada curriculo.</p>
                              </div>
                              <Button type="button" variant="outline" size="sm" onClick={() => addCurriculo(turno.id)}>
                                <Plus className="h-4 w-4 mr-2" /> Adicionar curriculo
                              </Button>
                            </div>
                            {turnoDraft.curriculos.map((curriculo, index) => {
                              const periodCount = curriculo.periodos.length;
                              const canRemoveCurriculo = turnoDraft.curriculos.length > 1 && !curriculo.isPersisted;
                              const removalTitle = canRemoveCurriculo
                                ? 'Remover curriculo'
                                : curriculo.isPersisted
                                  ? 'Curriculos existentes devem ser removidos na tela de curriculos.'
                                  : 'Mantenha pelo menos um curriculo por turno.';
                              return (
                                <div key={curriculo.id} className="border border-dashed border-gray-300 rounded-md p-4 space-y-4">
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-800">Curriculo {curriculo.versao || index + 1}</h4>
                                      <p className="text-xs text-gray-500">Turno {turno.nome} • {periodCount} periodo(s)</p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCurriculo(turno.id, curriculo.id)}
                                      disabled={!canRemoveCurriculo}
                                      className={`text-red-600 hover:text-red-700 ${!canRemoveCurriculo ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title={removalTitle}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" /> Remover curriculo
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Versao *</label>
                                      <Input
                                        value={curriculo.versao}
                                        onChange={(event) => updateCurriculoField(turno.id, curriculo.id, 'versao', event.target.value)}
                                        placeholder="Ex: v1.0"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 mt-6 md:justify-end">
                                      <input
                                        id={`curriculo-${curriculo.id}-ativo`}
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={curriculo.ativo}
                                        onChange={(event) => updateCurriculoField(turno.id, curriculo.id, 'ativo', event.target.checked)}
                                      />
                                      <label htmlFor={`curriculo-${curriculo.id}-ativo`} className="text-sm text-gray-700">
                                        Curriculo ativo
                                      </label>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Vigente de</label>
                                      <DatePicker
                                        value={curriculo.vigenteDe || null}
                                        onChange={(value) => updateCurriculoField(turno.id, curriculo.id, 'vigenteDe', value || '')}
                                        placeholder="dd/mm/aaaa"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Vigente ate</label>
                                      <DatePicker
                                        value={curriculo.vigenteAte || null}
                                        onChange={(value) => updateCurriculoField(turno.id, curriculo.id, 'vigenteAte', value || '')}
                                        placeholder="dd/mm/aaaa"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label htmlFor={`curriculo-${curriculo.id}-period-count`} className="block text-sm font-medium text-gray-700 mb-1">Quantidade de periodos *</label>
                                    <Input
                                      id={`curriculo-${curriculo.id}-period-count`}
                                      type="number"
                                      min={1}
                                      max={MAX_PERIOD_COUNT}
                                      value={periodCount}
                                      onChange={(event) => updateCurriculoPeriodCount(turno.id, curriculo.id, event.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Cada curriculo pode ter no maximo {MAX_PERIOD_COUNT} periodos. Ajuste conforme a versao ofertada.
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {wizardData.turnos.length === 0 && !isLoadingTurnos && (
                <p className="text-sm text-amber-600">
                  Selecione pelo menos um turno e configure seus curriculos para avancar.
                </p>
              )}
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <div className="space-y-6">
            {totalCurriculos === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-gray-600">
                  Nenhum curriculo configurado. Volte ao passo anterior e adicione ao menos um curriculo por turno selecionado.
                </CardContent>
              </Card>
            ) : (
              wizardData.turnos.map((turno) => {
                const turnoInfo = availableTurnos.find((item) => item.id === turno.turnoId);
                return turno.curriculos.map((curriculo) => (
                  <Card key={`${turno.turnoId}-${curriculo.id}`}>
                    <CardHeader>
                      <CardTitle>{turnoInfo?.nome || 'Turno'} • Curriculo {curriculo.versao || 'v1.0'}</CardTitle>
                      <CardDescription>Configure os periodos e disciplinas especificos deste curriculo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {curriculo.periodos.map((periodo) => {
                        const numeroFieldId = `periodo-${periodo.id}-numero` as const;
                        const nomeFieldId = `periodo-${periodo.id}-nome` as const;
                        const descricaoFieldId = `periodo-${periodo.id}-descricao` as const;
                        const removalDisabledReason = periodo.persistedId
                          ? 'persisted'
                          : curriculo.periodos.length <= 1
                            ? 'min'
                            : null;
                        const canRemovePeriod = removalDisabledReason === null;
                        const removalTitle =
                          removalDisabledReason === 'persisted'
                            ? 'Remova periodos existentes pela tela de periodos.'
                            : removalDisabledReason === 'min'
                              ? 'Mantenha pelo menos um periodo por curriculo.'
                              : 'Remover periodo';
                        return (
                          <div key={periodo.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                            <div className="space-y-3">
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                <div className="flex flex-col gap-1">
                                  <h4 className="text-sm font-semibold text-gray-800">Configuracao do periodo</h4>
                                  <p className="text-xs text-gray-500">Cadastre as disciplinas que compoem este periodo neste curriculo.</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePeriod(turno.turnoId, curriculo.id, periodo.id)}
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
                                    onChange={(event) => updatePeriodField(turno.turnoId, curriculo.id, periodo.id, 'numero', event.target.value)}
                                    placeholder="Ex: 1"
                                  />
                                  <p className="text-[11px] text-gray-500 mt-1">E permitido repetir numeros conforme necessario.</p>
                                </div>
                                <div>
                                  <label htmlFor={nomeFieldId} className="block text-xs font-medium text-gray-600 mb-1">Nome opcional</label>
                                  <Input
                                    id={nomeFieldId}
                                    value={periodo.nome}
                                    onChange={(event) => updatePeriodField(turno.turnoId, curriculo.id, periodo.id, 'nome', event.target.value)}
                                    placeholder="Nome do periodo (opcional)"
                                  />
                                </div>
                              </div>
                            </div>
                            <Textarea
                              id={descricaoFieldId}
                              value={periodo.descricao}
                              onChange={(event) => updatePeriodField(turno.turnoId, curriculo.id, periodo.id, 'descricao', event.target.value)}
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
                                const isCollapsed = disciplina.isLinkedFromExisting && !disciplina.expanded;

                                return (
                                  <div key={disciplina.id} className="border border-dashed border-gray-300 rounded-md p-4 space-y-3 bg-gray-50">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-700">
                                          Disciplina {disciplina.isLinkedFromExisting ? '(existente)' : ''}
                                        </h5>
                                        {isCollapsed && (
                                          <p className="text-xs text-gray-500">
                                            {disciplina.codigo} • {disciplina.nome} • {disciplina.creditos} créditos • {disciplina.cargaHoraria}h
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {disciplina.isLinkedFromExisting && (
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                              toggleDisciplineExpanded(turno.turnoId, curriculo.id, periodo.id, disciplina.id)
                                            }
                                          >
                                            {isCollapsed ? 'Editar' : 'Recolher'}
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeDiscipline(turno.turnoId, curriculo.id, periodo.id, disciplina.id)}
                                          className={`text-red-600 hover:text-red-700 ${disciplina.persistedId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          disabled={Boolean(disciplina.persistedId)}
                                          title={disciplina.persistedId ? 'Remova disciplinas existentes na tela de disciplinas.' : 'Remover disciplina'}
                                        >
                                          <Trash2 className="h-4 w-4 mr-1" /> Remover
                                        </Button>
                                      </div>
                                    </div>

                                    {isCollapsed ? (
                                      <div className="text-xs text-gray-600 grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                          <span className="font-semibold text-gray-700 block">Código</span>
                                          {disciplina.codigo}
                                        </div>
                                        <div>
                                          <span className="font-semibold text-gray-700 block">Nome</span>
                                          {disciplina.nome}
                                        </div>
                                        <div>
                                          <span className="font-semibold text-gray-700 block">Créditos</span>
                                          {disciplina.creditos}
                                        </div>
                                        <div>
                                          <span className="font-semibold text-gray-700 block">Carga horária</span>
                                          {disciplina.cargaHoraria}h
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                          <div>
                                            <label htmlFor={disciplinaCodigoFieldId} className="block text-xs font-medium text-gray-600 mb-1">Codigo *</label>
                                            <Input
                                              id={disciplinaCodigoFieldId}
                                              value={disciplina.codigo}
                                              onChange={(event) => updateDisciplineField(turno.turnoId, curriculo.id, periodo.id, disciplina.id, 'codigo', event.target.value)}
                                              placeholder="Ex: DISC101"
                                            />
                                          </div>
                                          <div>
                                            <label htmlFor={disciplinaNomeFieldId} className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                                            <Input
                                              id={disciplinaNomeFieldId}
                                              value={disciplina.nome}
                                              onChange={(event) => updateDisciplineField(turno.turnoId, curriculo.id, periodo.id, disciplina.id, 'nome', event.target.value)}
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
                                              onChange={(event) => updateDisciplineField(turno.turnoId, curriculo.id, periodo.id, disciplina.id, 'ordem', event.target.value)}
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
                                              onChange={(event) => updateDisciplineField(turno.turnoId, curriculo.id, periodo.id, disciplina.id, 'obrigatoria', event.target.checked)}
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
                                              onChange={(event) => updateDisciplineField(turno.turnoId, curriculo.id, periodo.id, disciplina.id, 'creditos', event.target.value)}
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
                                              onChange={(event) => updateDisciplineField(turno.turnoId, curriculo.id, periodo.id, disciplina.id, 'cargaHoraria', event.target.value)}
                                              placeholder="Ex: 60"
                                            />
                                          </div>
                                        </div>
                                        <Textarea
                                          value={disciplina.ementa}
                                          onChange={(event) => updateDisciplineField(turno.turnoId, curriculo.id, periodo.id, disciplina.id, 'ementa', event.target.value)}
                                          placeholder="Ementa (opcional)"
                                        />
                                        <Textarea
                                          value={disciplina.bibliografia}
                                          onChange={(event) => updateDisciplineField(turno.turnoId, curriculo.id, periodo.id, disciplina.id, 'bibliografia', event.target.value)}
                                          placeholder="Bibliografia (opcional)"
                                        />
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addDiscipline(turno.turnoId, curriculo.id, periodo.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" /> Nova disciplina
                                </Button>
                                {disciplineOptions.length > 0 && (
                                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <select
                                      className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      value={existingDisciplineSelections[periodo.id] ?? ''}
                                      onChange={(event) => handleExistingDisciplineSelection(periodo.id, event.target.value)}
                                      aria-label="Selecionar disciplina existente"
                                    >
                                      <option value="">Selecionar disciplina existente...</option>
                                      {disciplineOptions.map((option) => (
                                        <option key={option.key} value={option.key}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => attachExistingDisciplineToPeriod(turno.turnoId, curriculo.id, periodo.id)}
                                      disabled={!existingDisciplineSelections[periodo.id]}
                                    >
                                      Usar selecionada
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={() => addPeriod(turno.turnoId, curriculo.id)}>
                          <Plus className="h-4 w-4 mr-2" /> Adicionar periodo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ));
              })
            )}
            {hasIncompleteDiscipline && (
              <p className="text-sm text-red-600">
                Existem disciplinas com campos obrigatorios vazios. Complete ou remova as entradas pendentes antes de continuar.
              </p>
            )}
          </div>
        );
      case 3:
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
              </div>
              {wizardData.turnos.map((turno) => {
                const turnoInfo = availableTurnos.find((item) => item.id === turno.turnoId);
                return (
                  <div key={turno.turnoId} className="border border-gray-200 rounded-md p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <h5 className="text-sm font-semibold text-gray-800">{turnoInfo?.nome || 'Turno'}</h5>
                    </div>
                    {turno.curriculos.map((curriculo) => (
                      <div key={curriculo.id} className="pl-4 border-l border-dashed border-gray-300 space-y-2">
                        <p><strong>Curriculo:</strong> {curriculo.versao || 'v1.0'} • {curriculo.periodos.length} periodo(s)</p>
                        <p><strong>Status:</strong> {curriculo.ativo ? 'Ativo' : 'Inativo'}</p>
                        <p><strong>Vigencia:</strong> {curriculo.vigenteDe || 'Nao informado'} - {curriculo.vigenteAte || 'Nao informado'}</p>
                        {curriculo.periodos.map((periodo) => (
                          <div key={periodo.id} className="pl-4 border-l border-dotted border-gray-200 space-y-1">
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
                      disabled={isSubmitting || totalCurriculos === 0}
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

      {/* Modal de criação de turno */}
      {isCreateTurnoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-lg">
            <Card className="border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Criar novo turno</CardTitle>
                  <CardDescription>
                    Adicione um novo turno ao sistema
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreateTurnoModalOpen(false);
                    setNewTurnoNome('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="new-turno-nome" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do turno *
                  </label>
                  <Input
                    id="new-turno-nome"
                    value={newTurnoNome}
                    onChange={(e) => setNewTurnoNome(e.target.value)}
                    placeholder="Ex: Matutino, Vespertino, Noturno"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateTurno();
                      }
                    }}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O nome deve ter pelo menos 2 caracteres.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateTurnoModalOpen(false);
                      setNewTurnoNome('');
                    }}
                    disabled={createTurnoMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTurno}
                    disabled={createTurnoMutation.isPending || !newTurnoNome.trim() || newTurnoNome.trim().length < 2}
                  >
                    {createTurnoMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar turno
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}



















