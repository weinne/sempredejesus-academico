import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap } from 'lucide-react';

import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { CreateCurso } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { useFormErrors } from '@/hooks/use-form-errors';

const schema = z.object({
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(80, 'Nome deve ter no máximo 80 caracteres'),
  grau: z.string({ required_error: 'Selecione o grau' }).min(1, 'Selecione o grau acadêmico'),
});

type FormData = z.infer<typeof schema>;

export default function CursoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { handleFormError } = useFormErrors();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (curso: CreateCurso) => apiService.createCurso(curso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({ title: 'Curso criado', description: 'Curso cadastrado com sucesso!' });
      navigate('/cursos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao criar curso',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <CrudHeader title="Novo Curso" backTo="/cursos" description="Cadastro de curso" />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Novo Curso</h1>
            <p className="mt-1 text-sm text-slate-600">Cadastre um novo curso acadêmico</p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
              <FormSection
                icon={GraduationCap}
                title="Dados do Curso"
                description="Informações básicas do curso"
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Curso *</label>
                    <Input
                      data-field="nome"
                      {...register('nome')}
                      placeholder="Ex: Bacharelado em Teologia"
                      className={`h-11 ${errors.nome ? 'border-red-500' : ''}`}
                    />
                    <FieldError message={errors.nome?.message} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grau Acadêmico *</label>
                    <select
                      data-field="grau"
                      {...register('grau')}
                      className={`w-full h-11 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.grau ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Selecione o grau...</option>
                      <option value="BACHARELADO">Bacharelado</option>
                      <option value="LICENCIATURA">Licenciatura</option>
                      <option value="ESPECIALIZACAO">Especialização</option>
                      <option value="MESTRADO">Mestrado</option>
                      <option value="DOUTORADO">Doutorado</option>
                    </select>
                    <FieldError message={errors.grau?.message} />
                  </div>
                </div>
              </FormSection>

              <ActionsBar
                submitLabel="Cadastrar Curso"
                submittingLabel="Cadastrando..."
                isSubmitting={createMutation.isPending}
                cancelTo="/cursos"
              />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

