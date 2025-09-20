import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Curso, CreatePeriodo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  numero: z.number().min(1, 'Informe o número do período').max(255),
  nome: z.string().max(80).optional(),
  descricao: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export default function PeriodoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cursosResponse, isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePeriodo) => apiService.createPeriodo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      toast({ title: 'Período criado', description: 'Período criado com sucesso!' });
      navigate('/periodos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao criar período',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  const onSubmit = (data: FormData) => {
    const nome = data.nome?.trim();
    const descricao = data.descricao?.trim();
    const payload: CreatePeriodo = {
      ...data,
      nome: nome ? nome : undefined,
      descricao: descricao ? descricao : undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Novo Período" backTo="/periodos" description="Cadastro de período" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Período</CardTitle>
              <CardDescription>Informe o curso e os detalhes do período</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                    <select
                      {...register('cursoId', { valueAsNumber: true })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.cursoId ? 'border-red-500' : ''
                      }`}
                      disabled={loadingCursos}
                    >
                      <option value="">Selecione um curso...</option>
                      {cursos.map((curso: Curso) => (
                        <option key={curso.id} value={curso.id}>
                          {curso.nome} ({curso.grau})
                        </option>
                      ))}
                    </select>
                    {errors.cursoId && (
                      <p className="mt-1 text-sm text-red-600">{errors.cursoId.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número do período *</label>
                    <Input
                      type="number"
                      min="1"
                      max="255"
                      {...register('numero', { valueAsNumber: true })}
                      placeholder="Ex: 1"
                      className={errors.numero ? 'border-red-500' : ''}
                    />
                    {errors.numero && (
                      <p className="mt-1 text-sm text-red-600">{errors.numero.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do período (opcional)</label>
                    <Input
                      {...register('nome')}
                      placeholder="Ex: Fundamentos"
                      className={errors.nome ? 'border-red-500' : ''}
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                    <Textarea
                      {...register('descricao')}
                      rows={4}
                      placeholder="Detalhes adicionais sobre este período"
                      className={errors.descricao ? 'border-red-500' : ''}
                    />
                    {errors.descricao && (
                      <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    Criar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/periodos')}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
