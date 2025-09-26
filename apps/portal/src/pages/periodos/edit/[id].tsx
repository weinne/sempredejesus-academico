import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Curso, CreatePeriodo, Turno, Curriculo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  turnoId: z.number().min(1, 'Selecione um turno'),
  curriculoId: z.number().min(1, 'Selecione um currículo'),
  numero: z.number().min(1, 'Informe o número do período').max(255),
  nome: z.string().max(80).optional(),
  descricao: z.string().max(500).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PeriodoEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { data: cursosResponse, isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];
  const { data: turnos = [] } = useQuery({ queryKey: ['turnos'], queryFn: apiService.getTurnos });
  const { data: curriculos = [] } = useQuery({ queryKey: ['curriculos'], queryFn: () => apiService.getCurriculos() });

  const {
    data: periodo,
    isLoading,
  } = useQuery({
    queryKey: ['periodo', id],
    queryFn: () => apiService.getPeriodo(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (periodo) {
      reset({
        cursoId: periodo.cursoId,
        turnoId: (periodo as any).turnoId || undefined,
        curriculoId: (periodo as any).curriculoId || undefined,
        numero: periodo.numero,
        nome: periodo.nome ?? '',
        descricao: periodo.descricao ?? '',
        dataInicio: (periodo as any).dataInicio || '',
        dataFim: (periodo as any).dataFim || '',
      });
    }
  }, [periodo, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreatePeriodo>) => apiService.updatePeriodo(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      queryClient.invalidateQueries({ queryKey: ['periodo', id] });
      toast({ title: 'Período atualizado', description: 'Período atualizado com sucesso!' });
      navigate('/periodos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao atualizar período',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  const onSubmit = (data: FormData) => {
    const nome = data.nome?.trim();
    const descricao = data.descricao?.trim();
    updateMutation.mutate({
      ...data,
      nome: nome ? nome : undefined,
      descricao: descricao ? descricao : undefined,
    });
  };

  if (isLoading || !periodo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Período" backTo="/periodos" />
        <div className="max-w-4xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title={`Editar Período ${periodo.nome || periodo.numero}`} backTo="/periodos" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Atualização do Período</CardTitle>
              <CardDescription>Altere os dados do período selecionado</CardDescription>
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
                      className={errors.numero ? 'border-red-500' : ''}
                    />
                    {errors.numero && (
                      <p className="mt-1 text-sm text-red-600">{errors.numero.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno *</label>
                    <select
                      {...register('turnoId', { valueAsNumber: true })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        (errors as any).turnoId ? 'border-red-500' : ''
                      }`}
                      defaultValue={(periodo as any).turnoId || ''}
                    >
                      <option value="">Selecione um turno...</option>
                      {turnos.map((t: Turno) => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currículo *</label>
                    <select
                      {...register('curriculoId', { valueAsNumber: true })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        (errors as any).curriculoId ? 'border-red-500' : ''
                      }`}
                      defaultValue={(periodo as any).curriculoId || ''}
                    >
                      <option value="">Selecione um currículo...</option>
                      {curriculos.map((c: Curriculo) => (
                        <option key={c.id} value={c.id}>{c.versao} ({c.ativo ? 'Ativo' : 'Inativo'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de início (opcional)</label>
                    <Input type="date" {...register('dataInicio')} defaultValue={(periodo as any).dataInicio || ''} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de término (opcional)</label>
                    <Input type="date" {...register('dataFim')} defaultValue={(periodo as any).dataFim || ''} />
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
                  <Button type="submit" disabled={updateMutation.isPending}>
                    Salvar alterações
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
