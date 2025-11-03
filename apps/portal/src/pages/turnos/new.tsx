import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

export default function TurnoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { handleFormError } = useFormErrors();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { nome: string }) => apiService.createTurno(payload),
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
    createMutation.mutate({ nome: data.nome.trim() });
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
