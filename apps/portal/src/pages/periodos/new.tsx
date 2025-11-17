import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, ListOrdered, CalendarRange } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@/components/ui/date-picker';

import CrudHeader from '@/components/crud/crud-header';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/services/api';
import { Curso, Curriculo, CreatePeriodo, Turno } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  curriculoId: z.number().int().positive('Selecione um currículo'),
  numero: z.number().int().min(1, 'Informe o número do período').max(255),
  nome: z.string().max(80).optional(),
  descricao: z.string().max(500).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const parseNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const PeriodoNewPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cursosResponse, isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];

  const { data: turnos = [] } = useQuery({
    queryKey: ['turnos'],
    queryFn: () => apiService.getTurnos(),
  });

  const { data: curriculos = [] } = useQuery({
    queryKey: ['curriculos'],
    queryFn: () => apiService.getCurriculos(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [cursoFiltro, setCursoFiltro] = useState<number | ''>('');
  const selectedCurriculoId = watch('curriculoId');

  const cursosMap = useMemo(
    () => new Map(cursos.map((curso: Curso) => [curso.id, curso])),
    [cursos]
  );
  const turnosMap = useMemo(
    () => new Map(turnos.map((turno: Turno) => [turno.id, turno])),
    [turnos]
  );

  const curriculosFiltrados = useMemo(() => {
    if (cursoFiltro === '') {
      return curriculos;
    }
    return curriculos.filter((curriculo) => curriculo.cursoId === Number(cursoFiltro));
  }, [curriculos, cursoFiltro]);

  useEffect(() => {
    if (
      selectedCurriculoId &&
      !curriculosFiltrados.some((curriculo) => curriculo.id === selectedCurriculoId)
    ) {
      setValue('curriculoId', undefined as unknown as number, {
        shouldDirty: false,
        shouldValidate: true,
      });
    } else if (!selectedCurriculoId && curriculosFiltrados.length === 1) {
      setValue('curriculoId', curriculosFiltrados[0].id, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [curriculosFiltrados, selectedCurriculoId, setValue]);

  const selectedCurriculo = useMemo(() => {
    if (typeof selectedCurriculoId !== 'number') {
      return undefined;
    }
    return curriculos.find((curriculo) => curriculo.id === selectedCurriculoId);
  }, [curriculos, selectedCurriculoId]);

  const createMutation = useMutation({
    mutationFn: (payload: CreatePeriodo) => apiService.createPeriodo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      toast({
        title: 'Período cadastrado',
        description: 'O período foi criado com sucesso.',
      });
      navigate('/periodos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao criar período',
        description: error.message || 'Não foi possível criar o período.',
        variant: 'destructive',
      }),
  });

  const handleFormError = () => {
    toast({
      title: 'Revise os campos destacados',
      description: 'Algumas informações obrigatórias não foram preenchidas corretamente.',
      variant: 'destructive',
    });
  };

  const formatCurriculoLabel = (curriculo: Curriculo) => {
    const curso = cursosMap.get(curriculo.cursoId);
    const turno = turnosMap.get(curriculo.turnoId);
    const cursoNome = curso?.nome ?? 'Curso não informado';
    const turnoNome = turno?.nome ?? 'Turno não informado';
    return `${cursoNome} • ${turnoNome} • Versão ${curriculo.versao}`;
  };

  const onSubmit = (data: FormData) => {
    const nome = data.nome?.trim();
    const descricao = data.descricao?.trim();
    const payload: CreatePeriodo = {
      curriculoId: data.curriculoId,
      numero: data.numero,
      nome: nome || undefined,
      descricao: descricao || undefined,
      dataInicio: data.dataInicio || undefined,
      dataFim: data.dataFim || undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title="Cadastrar Período"
        description="Cadastre um novo período vinculado ao currículo correto."
        backTo="/periodos"
      />

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
          <FormSection
            icon={Layers3}
            title="Seleção de currículo"
            description="Escolha o currículo ao qual este período pertence. O curso e o turno serão definidos automaticamente."
          >
            <div data-field="cursoFiltro" className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filtrar por curso
              </label>
              <select
                value={cursoFiltro === '' ? '' : String(cursoFiltro)}
                onChange={(event) => {
                  const value = event.target.value;
                  setCursoFiltro(value ? Number(value) : '');
                }}
                disabled={loadingCursos}
                className="w-full h-11 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Todos os cursos</option>
                {cursos.map((curso: Curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome} ({curso.grau})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {cursoFiltro === ''
                  ? 'Exibindo currículos de todos os cursos disponíveis.'
                  : 'Filtrando currículos pelo curso selecionado.'}
              </p>
            </div>

            <div data-field="curriculoId" className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currículo *
              </label>
              <select
                {...register('curriculoId', { setValueAs: parseNumber })}
                className={`w-full h-11 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                  errors.curriculoId ? 'border-red-500' : ''
                }`}
                disabled={curriculosFiltrados.length === 0}
              >
                <option value="">
                  {curriculosFiltrados.length
                    ? 'Selecione um currículo...'
                    : cursoFiltro === ''
                      ? 'Nenhum currículo cadastrado até o momento.'
                      : 'Este curso ainda não possui currículos.'}
                </option>
                {curriculosFiltrados.map((curriculo: Curriculo) => (
                  <option key={curriculo.id} value={curriculo.id}>
                    {formatCurriculoLabel(curriculo)}
                  </option>
                ))}
              </select>
              <FieldError message={errors.curriculoId?.message} />
            </div>

            {selectedCurriculo && (
              <div className="md:col-span-2 rounded-md border border-slate-200 bg-slate-100/80 px-4 py-3 text-xs text-slate-600">
                <p className="font-medium text-slate-700">Resumo do currículo selecionado</p>
                <p>
                  Curso:{' '}
                  <span className="font-semibold">
                    {cursosMap.get(selectedCurriculo.cursoId)?.nome ?? '—'}
                  </span>
                </p>
                <p>
                  Turno:{' '}
                  <span className="font-semibold">
                    {turnosMap.get(selectedCurriculo.turnoId)?.nome ?? '—'}
                  </span>
                </p>
                <p>Versão: {selectedCurriculo.versao}</p>
                <p>Status: {selectedCurriculo.ativo ? 'Ativo' : 'Inativo'}</p>
              </div>
            )}
          </FormSection>

          <FormSection
            icon={ListOrdered}
            title="Informações do período"
            description="Defina os dados principais e identifique o período corretamente."
          >
            <div data-field="numero">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número *
              </label>
              <Input
                type="number"
                min={1}
                max={255}
                {...register('numero', { setValueAs: parseNumber })}
                placeholder="Ex: 1"
                className={`h-11 ${errors.numero ? 'border-red-500' : ''}`}
              />
              <FieldError message={errors.numero?.message} />
            </div>

            <div className="md:col-span-2" data-field="nome">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do período (opcional)
              </label>
              <Input
                {...register('nome')}
                placeholder="Ex: Fundamentos"
                maxLength={80}
                className={errors.nome ? 'border-red-500 h-11' : 'h-11'}
              />
              <FieldError message={errors.nome?.message} />
            </div>

            <div className="md:col-span-2" data-field="descricao">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição (opcional)
              </label>
              <Textarea
                {...register('descricao')}
                rows={5}
                placeholder="Adicione observações relevantes sobre este período."
                className={errors.descricao ? 'border-red-500' : ''}
              />
              <FieldError message={errors.descricao?.message} />
            </div>
          </FormSection>

          <FormSection
            icon={CalendarRange}
            title="Datas do período"
            description="Informe as datas para fins de cronograma acadêmico (opcional)."
          >
            <div data-field="dataInicio">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data de início
              </label>
              <Controller
                name="dataInicio"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || null}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
            </div>

            <div data-field="dataFim">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data de término
              </label>
              <Controller
                name="dataFim"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || null}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
            </div>
          </FormSection>

          <ActionsBar
            isSubmitting={createMutation.isPending}
            submitLabel="Cadastrar Período"
            submittingLabel="Cadastrando..."
            cancelTo="/periodos"
          />
        </form>
      </main>
    </div>
  );
};

export default PeriodoNewPage;











