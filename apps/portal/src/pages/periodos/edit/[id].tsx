import React, { useEffect } from 'react';
import { Layers3, ListOrdered, CalendarRange } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@/components/ui/date-picker';

import CrudHeader from '@/components/crud/crud-header';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/services/api';
import { UpdatePeriodo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  curriculoId: z.number().int().positive(),
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

const PeriodoEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: periodo, isLoading } = useQuery({
    queryKey: ['periodo', id],
    queryFn: () => apiService.getPeriodo(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (periodo) {
      reset({
        curriculoId: periodo.curriculoId,
        numero: periodo.numero,
        nome: periodo.nome ?? '',
        descricao: periodo.descricao ?? '',
        dataInicio: periodo.dataInicio || '',
        dataFim: periodo.dataFim || '',
      });
    }
  }, [periodo, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePeriodo) => apiService.updatePeriodo(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      queryClient.invalidateQueries({ queryKey: ['periodo', id] });
      toast({
        title: 'Período atualizado',
        description: 'As informações do período foram salvas com sucesso.',
      });
      navigate('/periodos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao atualizar período',
        description: error.message || 'Não foi possível atualizar o período.',
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

  const onSubmit = (data: FormData) => {
    const nome = data.nome?.trim();
    const descricao = data.descricao?.trim();
    updateMutation.mutate({
      curriculoId: data.curriculoId,
      numero: data.numero,
      nome: nome || undefined,
      descricao: descricao || undefined,
      dataInicio: data.dataInicio || undefined,
      dataFim: data.dataFim || undefined,
    });
  };

  if (isLoading || !periodo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CrudHeader title="Editar Período" backTo="/periodos" />
        <div className="max-w-4xl mx-auto p-6 text-sm text-slate-600">
          Carregando informações do período...
        </div>
      </div>
    );
  }

  const cursoNome = periodo.curso?.nome ?? '—';
  const cursoGrau = periodo.curso?.grau ?? '—';
  const turnoNome = periodo.turno?.nome ?? '—';
  const curriculoVersao = periodo.curriculo?.versao ?? '—';
  const curriculoStatus = periodo.curriculo?.ativo ? 'Ativo' : 'Inativo';

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title={`Editar Período ${periodo.nome || periodo.numero}`}
        description="Atualize as informações descritivas do período. Curso, turno e currículo não podem ser alterados."
        backTo="/periodos"
      />

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
          <input type="hidden" {...register('curriculoId', { setValueAs: parseNumber })} />

          <FormSection
            icon={Layers3}
            title="Contexto acadêmico"
            description="Informações fixas sobre onde este período está localizado."
          >
            <div data-field="curso" className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Curso
              </label>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <p className="font-medium">{cursoNome}</p>
                <p className="text-xs text-slate-500">Grau acadêmico: {cursoGrau}</p>
              </div>
            </div>

            <div data-field="turno" className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Turno
              </label>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {turnoNome}
              </div>
            </div>

            <div data-field="curriculo" className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currículo
              </label>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <p className="font-medium">Versão {curriculoVersao}</p>
                <p className="text-xs text-slate-500">Status: {curriculoStatus}</p>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={ListOrdered}
            title="Informações do período"
            description="Atualize o identificador e os detalhes descritivos."
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
                maxLength={80}
                placeholder="Ex: Fundamentos de Teologia"
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
                placeholder="Inclua detalhes complementares sobre o período, se necessário."
                className={errors.descricao ? 'border-red-500' : ''}
              />
              <FieldError message={errors.descricao?.message} />
            </div>
          </FormSection>

          <FormSection
            icon={CalendarRange}
            title="Datas"
            description="Informe as datas previstas para o início e término do período."
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
            isSubmitting={updateMutation.isPending}
            submitLabel="Salvar alterações"
            submittingLabel="Salvando..."
            cancelTo="/periodos"
          />
        </form>
      </main>
    </div>
  );
};

export default PeriodoEditPage;
