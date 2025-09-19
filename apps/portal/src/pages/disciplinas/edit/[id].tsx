import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const disciplinaSchema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  codigo: z.string().min(1, 'Código é obrigatório').max(10),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  creditos: z.number().min(1).max(32767),
  cargaHoraria: z.number().min(1),
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

  const { data: disciplina, isLoading } = useQuery({
    queryKey: ['disciplina', id],
    queryFn: async () => {
      return apiService.getDisciplina(Number(id));
    },
    enabled: !!id,
  });

  const { data: cursosResponse } = useQuery({ queryKey: ['cursos'], queryFn: () => apiService.getCursos({ limit: 100 }) });
  const cursos = cursosResponse?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DisciplinaFormData>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: {
      ativo: true,
    }
  });

  // Reset form when disciplina data is loaded
  React.useEffect(() => {
    if (disciplina) {
      reset({
        cursoId: disciplina.cursoId,
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
      toast({ title: 'Disciplina atualizada', description: 'Disciplina atualizada com sucesso!' });
      navigate('/disciplinas');
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar disciplina', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  if (isLoading || !disciplina) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Disciplina" backTo="/disciplinas" />
        <div className="max-w-5xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title={`Editar Disciplina: ${disciplina.nome}`} backTo="/disciplinas" />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Disciplina</CardTitle>
              <CardDescription>Atualize as informações da disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                    <select {...register('cursoId', { valueAsNumber: true })} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.cursoId ? 'border-red-500' : ''}`}>
                      <option value="">Selecione um curso...</option>
                      {cursos.map((curso: any) => (
                        <option key={curso.id} value={curso.id}>{curso.nome} ({curso.grau})</option>
                      ))}
                    </select>
                    {errors.cursoId && (<p className="mt-1 text-sm text-red-600">{errors.cursoId.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                    <Input {...register('codigo')} placeholder="Ex: TEOL101" />
                    {errors.codigo && (<p className="mt-1 text-sm text-red-600">{errors.codigo.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Disciplina *</label>
                    <Input {...register('nome')} placeholder="Ex: Introdução à Teologia" />
                    {errors.nome && (<p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Créditos *</label>
                    <Input {...register('creditos', { valueAsNumber: true })} type="number" min="1" />
                    {errors.creditos && (<p className="mt-1 text-sm text-red-600">{errors.creditos.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária *</label>
                    <Input {...register('cargaHoraria', { valueAsNumber: true })} type="number" min="1" />
                    {errors.cargaHoraria && (<p className="mt-1 text-sm text-red-600">{errors.cargaHoraria.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select {...register('ativo')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value="true">Ativa</option>
                      <option value="false">Inativa</option>
                    </select>
                    {errors.ativo && (<p className="mt-1 text-sm text-red-600">{errors.ativo.message}</p>)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ementa</label>
                    <Textarea {...register('ementa')} rows={4} />
                    {errors.ementa && (<p className="mt-1 text-sm text-red-600">{errors.ementa.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bibliografia</label>
                    <Textarea {...register('bibliografia')} rows={4} />
                    {errors.bibliografia && (<p className="mt-1 text-sm text-red-600">{errors.bibliografia.message}</p>)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
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


