import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Curso, Periodo } from '@/types/api';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  periodoId: z.number().min(1, 'Selecione um período'),
  codigo: z.string().min(1).max(10),
  nome: z.string().min(2).max(120),
  creditos: z.number().min(1).max(32767),
  cargaHoraria: z.number().min(1),
  ementa: z.string().optional(),
  bibliografia: z.string().optional(),
  ativo: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function DisciplinaNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cursosResponse } = useQuery({ queryKey: ['cursos'], queryFn: () => apiService.getCursos({ limit: 100 }) });
  const cursos = cursosResponse?.data || [];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ativo: true },
  });
  const selectedCursoId = watch('cursoId');

  useEffect(() => {
    setValue('periodoId', undefined as unknown as number, { shouldValidate: false, shouldDirty: false });
  }, [selectedCursoId, setValue]);

  const { data: periodosResponse } = useQuery({
    queryKey: ['periodos', selectedCursoId],
    queryFn: () => apiService.getPeriodos({ cursoId: selectedCursoId!, limit: 100 }),
    enabled: !!selectedCursoId,
  });
  const periodos = periodosResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiService.createDisciplina(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({ title: 'Disciplina criada', description: 'Disciplina criada com sucesso!' });
      navigate('/disciplinas');
    },
    onError: (error: any) => toast({ title: 'Erro ao criar disciplina', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Nova Disciplina" backTo="/disciplinas" description="Cadastro de disciplina" />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Disciplina</CardTitle>
              <CardDescription>Preencha as informações da disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                      <select {...register('cursoId', { valueAsNumber: true })} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.cursoId ? 'border-red-500' : ''}`}>
                        <option value="">Selecione um curso...</option>
                        {cursos.map((curso: Curso) => (
                          <option key={curso.id} value={curso.id}>{curso.nome} ({curso.grau})</option>
                        ))}
                      </select>
                      {errors.cursoId && (<p className="mt-1 text-sm text-red-600">{errors.cursoId.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Período *</label>
                      <select
                        {...register('periodoId', { valueAsNumber: true })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.periodoId ? 'border-red-500' : ''}`}
                        disabled={!selectedCursoId}
                      >
                        <option value="">{selectedCursoId ? 'Selecione um período...' : 'Selecione um curso primeiro'}</option>
                        {periodos.map((periodo: Periodo) => (
                          <option key={periodo.id} value={periodo.id}>
                            {periodo.nome || `Período ${periodo.numero}`}
                          </option>
                        ))}
                      </select>
                      {errors.periodoId && (<p className="mt-1 text-sm text-red-600">{errors.periodoId.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                      <Input {...register('codigo')} placeholder="Ex: TEOL101" className={errors.codigo ? 'border-red-500' : ''} />
                      {errors.codigo && (<p className="mt-1 text-sm text-red-600">{errors.codigo.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Disciplina *</label>
                      <Input {...register('nome')} placeholder="Ex: Introdução à Teologia" className={errors.nome ? 'border-red-500' : ''} />
                      {errors.nome && (<p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Créditos *</label>
                      <Input type="number" min="1" max="32767" {...register('creditos', { valueAsNumber: true })} className={errors.creditos ? 'border-red-500' : ''} />
                      {errors.creditos && (<p className="mt-1 text-sm text-red-600">{errors.creditos.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária *</label>
                      <Input type="number" min="1" {...register('cargaHoraria', { valueAsNumber: true })} placeholder="Ex: 60" className={errors.cargaHoraria ? 'border-red-500' : ''} />
                      {errors.cargaHoraria && (<p className="mt-1 text-sm text-red-600">{errors.cargaHoraria.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select {...register('ativo')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        <option value="true">Ativa</option>
                        <option value="false">Inativa</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Plano de Ensino</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ementa</label>
                      <Textarea {...register('ementa')} placeholder="Descreva os objetivos e conteúdo da disciplina..." rows={4} className={errors.ementa ? 'border-red-500' : ''} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bibliografia</label>
                      <Textarea {...register('bibliografia')} placeholder="Liste os livros e materiais de referência..." rows={4} className={errors.bibliografia ? 'border-red-500' : ''} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/disciplinas')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


