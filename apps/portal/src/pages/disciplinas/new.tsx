import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useFormErrors } from '@/hooks/use-form-errors';
import { numberOrUndefined } from '@/lib/form-utils';
import { Curso } from '@/types/api';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  cursoId: z.number({ message: 'Curso é obrigatório' }).min(1, 'Selecione um curso'),
  codigo: z.string().min(1, 'Código é obrigatório').max(10, 'Código deve ter no máximo 10 caracteres'),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(120, 'Nome deve ter no máximo 120 caracteres'),
  creditos: z.number({ message: 'Créditos são obrigatórios' }).min(1, 'Créditos devem ser pelo menos 1').max(32767),
  cargaHoraria: z.number({ message: 'Carga horária é obrigatória' }).min(1, 'Carga horária deve ser pelo menos 1'),
  ementa: z.string().optional(),
  bibliografia: z.string().optional(),
  objetivos: z.string().optional(),
  conteudoProgramatico: z.string().optional(),
  instrumentosEAvaliacao: z.string().optional(),
  ativo: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function DisciplinaNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { handleFormError } = useFormErrors();

  const { data: cursosResponse } = useQuery({ 
    queryKey: ['cursos'], 
    queryFn: () => apiService.getCursos({ limit: 100 }) 
  });
  const cursos = cursosResponse?.data || [];

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ativo: true },
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiService.createDisciplina(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({ 
        title: 'Disciplina cadastrada', 
        description: 'Disciplina cadastrada com sucesso!' 
      });
      navigate('/disciplinas');
    },
    onError: (error: any) => toast({ 
      title: 'Erro ao cadastrar disciplina', 
      description: error.message || 'Erro desconhecido', 
      variant: 'destructive' 
    }),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Breadcrumb */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/disciplinas" className="ml-2">
                <Button variant="ghost" size="icon" title="Voltar">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cadastrar Disciplina</h1>
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                  <Link to="/disciplinas" className="hover:text-gray-700">Disciplinas</Link>
                  <span>/</span>
                  <span className="text-gray-900">Cadastrar</span>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data), handleFormError)} className="space-y-8">
          
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

            <div className="md:col-span-2 text-xs text-slate-500 bg-slate-100/70 border border-slate-200 rounded-md p-3">
              Após salvar a disciplina, vincule-a aos períodos desejados na página da própria disciplina ou na visão de períodos.
              Lá você poderá definir ordem e obrigatoriedade para cada currículo.
            </div>
          </FormSection>

          {/* Plano de Ensino */}
          <FormSection
            icon={FileText}
            title="Plano de Ensino"
            description="Detalhamento completo da disciplina"
          >
            <div className="lg:col-span-3" data-field="ementa">
              <label className="block text-sm font-medium text-slate-700 mb-2">Ementa</label>
              <RichTextEditor
                value={watch('ementa') || ''}
                onChange={(value) => setValue('ementa', value)}
                placeholder="Descreva os objetivos e conteúdo da disciplina..."
                rows={5}
              />
              <FieldError message={errors.ementa?.message} />
            </div>

            <div className="lg:col-span-3" data-field="bibliografia">
              <label className="block text-sm font-medium text-slate-700 mb-2">Bibliografia</label>
              <RichTextEditor
                value={watch('bibliografia') || ''}
                onChange={(value) => setValue('bibliografia', value)}
                placeholder="Liste os livros e materiais de referência..."
                rows={5}
              />
              <FieldError message={errors.bibliografia?.message} />
            </div>

            <div className="lg:col-span-3" data-field="objetivos">
              <label className="block text-sm font-medium text-slate-700 mb-2">Objetivos</label>
              <RichTextEditor
                value={watch('objetivos') || ''}
                onChange={(value) => setValue('objetivos', value)}
                placeholder="Descreva os objetivos de aprendizagem da disciplina..."
                rows={5}
              />
              <FieldError message={errors.objetivos?.message} />
            </div>

            <div className="lg:col-span-3" data-field="conteudoProgramatico">
              <label className="block text-sm font-medium text-slate-700 mb-2">Conteúdo Programático</label>
              <RichTextEditor
                value={watch('conteudoProgramatico') || ''}
                onChange={(value) => setValue('conteudoProgramatico', value)}
                placeholder="Descreva o conteúdo programático da disciplina..."
                rows={5}
              />
              <FieldError message={errors.conteudoProgramatico?.message} />
            </div>

            <div className="lg:col-span-3" data-field="instrumentosEAvaliacao">
              <label className="block text-sm font-medium text-slate-700 mb-2">Instrumentos e Critérios de Avaliação</label>
              <RichTextEditor
                value={watch('instrumentosEAvaliacao') || ''}
                onChange={(value) => setValue('instrumentosEAvaliacao', value)}
                placeholder="Descreva os instrumentos e critérios de avaliação..."
                rows={5}
              />
              <FieldError message={errors.instrumentosEAvaliacao?.message} />
            </div>
          </FormSection>

          {/* Actions */}
          <ActionsBar 
            isSubmitting={createMutation.isPending} 
            submitLabel="Cadastrar Disciplina" 
            submittingLabel="Cadastrando..." 
            cancelTo="/disciplinas"
          />
        </form>
      </main>
    </div>
  );
}
