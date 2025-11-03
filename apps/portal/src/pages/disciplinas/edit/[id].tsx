import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CrudHeader from '@/components/crud/crud-header';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useFormErrors } from '@/hooks/use-form-errors';
import { numberOrUndefined } from '@/lib/form-utils';
import { Curso, Periodo } from '@/types/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const disciplinaSchema = z.object({
  cursoId: z.number({ required_error: 'Curso é obrigatório' }).min(1, 'Selecione um curso'),
  periodoId: z.number({ required_error: 'Período é obrigatório' }).min(1, 'Selecione um período'),
  codigo: z.string().min(1, 'Código é obrigatório').max(10, 'Código deve ter no máximo 10 caracteres'),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(120, 'Nome deve ter no máximo 120 caracteres'),
  creditos: z.number({ required_error: 'Créditos são obrigatórios' }).min(1, 'Créditos devem ser pelo menos 1').max(32767),
  cargaHoraria: z.number({ required_error: 'Carga horária é obrigatória' }).min(1, 'Carga horária deve ser pelo menos 1'),
  ementa: z.string().optional(),
  bibliografia: z.string().optional(),
  ativo: z.union([z.boolean(), z.string()]).transform(val => val === 'true' || val === true),
});

type DisciplinaFormData = z.infer<typeof disciplinaSchema>;

export default function DisciplinaEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleFormError } = useFormErrors<DisciplinaFormData>();

  const { data: disciplina, isLoading } = useQuery({
    queryKey: ['disciplina', id],
    queryFn: async () => {
      return apiService.getDisciplina(Number(id));
    },
    enabled: !!id,
  });

  const { data: cursosResponse } = useQuery({ 
    queryKey: ['cursos'], 
    queryFn: () => apiService.getCursos({ limit: 100 }) 
  });
  const cursos = cursosResponse?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DisciplinaFormData>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: {
      ativo: true,
    }
  });

  const selectedCursoIdRaw = watch('cursoId');
  const selectedCursoId = isNaN(Number(selectedCursoIdRaw)) || !selectedCursoIdRaw ? undefined : Number(selectedCursoIdRaw);

  // Limpar período quando curso mudar (exceto na carga inicial)
  useEffect(() => {
    if (!selectedCursoId) {
      setValue('periodoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
      return;
    }
    if (disciplina && selectedCursoId === disciplina.cursoId) {
      setValue('periodoId', disciplina.periodoId, { shouldDirty: false, shouldValidate: false });
    } else {
      setValue('periodoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
    }
  }, [disciplina, selectedCursoId, setValue]);

  const { data: periodosResponse } = useQuery({
    queryKey: ['periodos', selectedCursoId],
    queryFn: () => apiService.getPeriodos({ cursoId: selectedCursoId!, limit: 100 }),
    enabled: !!selectedCursoId,
  });
  const periodos = periodosResponse?.data || [];

  // Reset form when disciplina data is loaded
  React.useEffect(() => {
    if (disciplina) {
      reset({
        cursoId: disciplina.cursoId,
        periodoId: disciplina.periodoId,
        codigo: disciplina.codigo || '',
        nome: disciplina.nome,
        creditos: disciplina.creditos,
        cargaHoraria: disciplina.cargaHoraria,
        ementa: disciplina.ementa || '',
        bibliografia: disciplina.bibliografia || '',
        ativo: disciplina.ativo,
      });
    }
  }, [disciplina, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: DisciplinaFormData) => apiService.updateDisciplina(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      queryClient.invalidateQueries({ queryKey: ['disciplina', id] });
      toast({ 
        title: 'Disciplina atualizada', 
        description: 'Dados atualizados com sucesso!' 
      });
      navigate('/disciplinas');
    },
    onError: (error: any) => toast({ 
      title: 'Erro ao atualizar disciplina', 
      description: error.message || 'Erro desconhecido', 
      variant: 'destructive' 
    }),
  });

  if (isLoading || !disciplina) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CrudHeader title="Editar Disciplina" backTo="/disciplinas" />
        <div className="max-w-6xl mx-auto p-6 text-center text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader 
        title={`Editar Disciplina: ${disciplina.nome}`} 
        backTo="/disciplinas" 
        description={`Código: ${disciplina.codigo || 'N/A'}`}
      />
      
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data), handleFormError)} className="space-y-8">
          
          {/* Informações Básicas */}
          <FormSection
            icon={Building2}
            title="Informações Básicas"
            description="Dados gerais da disciplina"
          >
            <div data-field="cursoId">
              <label className="block text-sm font-medium text-slate-700 mb-2">Curso *</label>
              <select 
                {...register('cursoId', { setValueAs: numberOrUndefined })} 
                className={`w-full h-11 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${errors.cursoId ? 'border-red-500' : ''}`}
              >
                <option value="">Selecione um curso...</option>
                {cursos.map((curso: Curso) => (
                  <option key={curso.id} value={curso.id}>{curso.nome} ({curso.grau})</option>
                ))}
              </select>
              <FieldError message={errors.cursoId?.message} />
            </div>

            <div data-field="periodoId">
              <label className="block text-sm font-medium text-slate-700 mb-2">Período *</label>
              <select
                {...register('periodoId', { setValueAs: numberOrUndefined })}
                className={`w-full h-11 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${errors.periodoId ? 'border-red-500' : ''}`}
                disabled={!selectedCursoId}
              >
                <option value="">{selectedCursoId ? 'Selecione um período...' : 'Selecione um curso primeiro'}</option>
                {periodos.map((periodo: Periodo) => (
                  <option key={periodo.id} value={periodo.id}>
                    {periodo.nome || `Período ${periodo.numero}`}
                  </option>
                ))}
              </select>
              <FieldError message={errors.periodoId?.message} />
              {!selectedCursoId && (
                <p className="mt-1 text-xs text-slate-500">Selecione um curso para ver os períodos disponíveis</p>
              )}
            </div>

            <div data-field="codigo">
              <label className="block text-sm font-medium text-slate-700 mb-2">Código *</label>
              <Input 
                {...register('codigo')} 
                placeholder="Ex: TEOL101" 
                maxLength={10}
                className={`${errors.codigo ? 'border-red-500' : ''} h-11`} 
              />
              <FieldError message={errors.codigo?.message} />
            </div>

            <div className="lg:col-span-2" data-field="nome">
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Disciplina *</label>
              <Input 
                {...register('nome')} 
                placeholder="Ex: Introdução à Teologia Sistemática" 
                className={`${errors.nome ? 'border-red-500' : ''} h-11`} 
              />
              <FieldError message={errors.nome?.message} />
            </div>

            <div data-field="creditos">
              <label className="block text-sm font-medium text-slate-700 mb-2">Créditos *</label>
              <Input 
                type="number" 
                min="1" 
                max="32767" 
                {...register('creditos', { setValueAs: numberOrUndefined })} 
                placeholder="Ex: 4"
                className={`${errors.creditos ? 'border-red-500' : ''} h-11`} 
              />
              <FieldError message={errors.creditos?.message} />
            </div>

            <div data-field="cargaHoraria">
              <label className="block text-sm font-medium text-slate-700 mb-2">Carga Horária (horas) *</label>
              <Input 
                type="number" 
                min="1" 
                {...register('cargaHoraria', { setValueAs: numberOrUndefined })} 
                placeholder="Ex: 60" 
                className={`${errors.cargaHoraria ? 'border-red-500' : ''} h-11`} 
              />
              <FieldError message={errors.cargaHoraria?.message} />
            </div>

            <div data-field="ativo">
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select 
                {...register('ativo', { 
                  setValueAs: (v) => v === 'true' || v === true 
                })} 
                className="w-full h-11 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
            </div>
          </FormSection>

          {/* Plano de Ensino */}
          <FormSection
            icon={FileText}
            title="Plano de Ensino"
            description="Ementa e bibliografia da disciplina"
          >
            <div className="lg:col-span-3" data-field="ementa">
              <label className="block text-sm font-medium text-slate-700 mb-2">Ementa</label>
              <Textarea 
                {...register('ementa')} 
                placeholder="Descreva os objetivos e conteúdo da disciplina..." 
                rows={5} 
                className={errors.ementa ? 'border-red-500' : ''} 
              />
              <FieldError message={errors.ementa?.message} />
            </div>

            <div className="lg:col-span-3" data-field="bibliografia">
              <label className="block text-sm font-medium text-slate-700 mb-2">Bibliografia</label>
              <Textarea 
                {...register('bibliografia')} 
                placeholder="Liste os livros e materiais de referência..." 
                rows={5} 
                className={errors.bibliografia ? 'border-red-500' : ''} 
              />
              <FieldError message={errors.bibliografia?.message} />
            </div>
          </FormSection>

          {/* Actions */}
          <ActionsBar 
            isSubmitting={updateMutation.isPending} 
            submitText="Atualizar Disciplina" 
            cancelTo="/disciplinas"
          />
        </form>
      </main>
    </div>
  );
}
