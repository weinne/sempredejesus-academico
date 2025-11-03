import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock } from 'lucide-react';

import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { useFormErrors } from '@/hooks/use-form-errors';

const schema = z.object({
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(30, 'Nome deve ter no máximo 30 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function TurnoEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleFormError } = useFormErrors();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { data: turno, isLoading } = useQuery({
    queryKey: ['turno', id],
    queryFn: () => apiService.getTurnos().then((turnos) => turnos.find((t) => t.id === Number(id))),
    enabled: !!id,
  });

  useEffect(() => {
    if (turno) {
      reset({ nome: turno.nome });
    }
  }, [turno, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<{ nome: string }>) => apiService.updateTurno(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      toast({ title: 'Turno atualizado', description: 'Dados atualizados com sucesso!' });
      navigate('/turnos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao atualizar turno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate({ nome: data.nome.trim() });
  };

  if (isLoading || !turno) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <CrudHeader title="Editar Turno" backTo="/turnos" />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <p className="text-slate-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <CrudHeader title={`Editar Turno: ${turno.nome}`} backTo="/turnos" description="Atualização de dados" />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Editar Turno</h1>
            <p className="mt-1 text-sm text-slate-600">Atualize as informações do turno</p>
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

              <ActionsBar
                submitLabel="Atualizar Turno"
                submittingLabel="Atualizando..."
                isSubmitting={updateMutation.isPending}
                cancelTo="/turnos"
              />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
