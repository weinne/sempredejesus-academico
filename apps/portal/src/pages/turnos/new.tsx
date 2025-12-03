import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Plus, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { CreateTurno } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { useFormErrors } from '@/hooks/use-form-errors';
import { TimeInput } from '@/components/ui/time-input';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const horarioSchema = z
  .object({
    id: z.string().optional(),
    ordem: z.number().int().nonnegative().optional(),
    descricao: z
      .string()
      .max(80, 'Descrição deve ter no máximo 80 caracteres')
      .nullable()
      .optional(),
    horaInicio: z.string().regex(timeRegex, 'Informe o horário inicial (HH:mm)'),
    horaFim: z.string().regex(timeRegex, 'Informe o horário final (HH:mm)'),
  })
  .refine(
    (value) => {
      if (!value.horaInicio || !value.horaFim) return true;
      return value.horaInicio < value.horaFim;
    },
    { message: 'Horário final deve ser maior que o inicial', path: ['horaFim'] },
  );

const generateHorarioId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const schema = z.object({
  nome: z
    .string({ message: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(30, 'Nome deve ter no máximo 30 caracteres'),
  horarios: z
    .array(horarioSchema)
    .min(1, 'Inclua pelo menos um horário para o turno'),
});

type FormData = z.infer<typeof schema>;

export default function TurnoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { handleFormError } = useFormErrors();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      horarios: [
        { id: generateHorarioId(), descricao: '1º Horário', horaInicio: '', horaFim: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'horarios',
  });

  const handleAddHorario = () => {
    append({
      id: generateHorarioId(),
      descricao: `${fields.length + 1}º Horário`,
      horaInicio: '',
      horaFim: '',
    });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateTurno) => apiService.createTurno(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      toast({ title: 'Turno criado', description: 'Turno cadastrado com sucesso!' });
      navigate('/turnos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao criar turno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  const onSubmit = (data: FormData) => {
    const horariosPayload = data.horarios.map((horario, index) => ({
      id: horario.id,
      descricao: horario.descricao?.trim() || `${index + 1}º horário`,
      horaInicio: horario.horaInicio,
      horaFim: horario.horaFim,
      ordem: index + 1,
    }));

    createMutation.mutate({
      nome: data.nome.trim(),
      horarios: horariosPayload,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <CrudHeader title="Novo Turno" backTo="/turnos" description="Cadastro de turno" />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Novo Turno</h1>
            <p className="mt-1 text-sm text-slate-600">Cadastre um novo turno acadêmico</p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
              <FormSection
                icon={Clock}
                title="Dados do Turno"
                description="Informações básicas do turno"
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Turno *</label>
                    <Input
                      data-field="nome"
                      {...register('nome')}
                      placeholder="Ex: Matutino, Vespertino, Noturno"
                      className={`h-11 ${errors.nome ? 'border-red-500' : ''}`}
                    />
                    <FieldError message={errors.nome?.message} />
                  </div>
                </div>
              </FormSection>

              <FormSection
                icon={Clock}
                title="Horários do turno"
                description="Defina um ou mais intervalos em formato 24 horas"
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
              >
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700">Horário #{index + 1}</p>
                          <p className="text-xs text-slate-500">Configure o intervalo {index + 1} do turno</p>
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                          <Input
                            placeholder="Ex: 1º horário"
                            {...register(`horarios.${index}.descricao` as const)}
                          />
                          <FieldError message={errors.horarios?.[index]?.descricao?.message} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Início *</label>
                          <Controller
                            control={control}
                            name={`horarios.${index}.horaInicio` as const}
                            render={({ field }) => (
                              <TimeInput
                                {...field}
                                placeholder="08:00"
                                className="w-full"
                              />
                            )}
                          />
                          <FieldError message={errors.horarios?.[index]?.horaInicio?.message} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fim *</label>
                          <Controller
                            control={control}
                            name={`horarios.${index}.horaFim` as const}
                            render={({ field }) => (
                              <TimeInput
                                {...field}
                                placeholder="10:00"
                                className="w-full"
                              />
                            )}
                          />
                          <FieldError message={errors.horarios?.[index]?.horaFim?.message} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                      onClick={handleAddHorario}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar horário
                    </button>
                  </div>
                  {typeof errors.horarios?.message === 'string' && (
                    <FieldError message={errors.horarios.message} />
                  )}
                  {typeof (errors.horarios as any)?.root?.message === 'string' && (
                    <FieldError message={(errors.horarios as any).root.message} />
                  )}
                </div>
              </FormSection>

              <ActionsBar
                submitLabel="Cadastrar Turno"
                submittingLabel="Cadastrando..."
                isSubmitting={createMutation.isPending}
                cancelTo="/turnos"
              />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
