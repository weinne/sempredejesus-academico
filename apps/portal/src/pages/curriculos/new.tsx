import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Curso, Turno, CreateCurriculo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  turnoId: z.number().min(1, 'Selecione um turno'),
  versao: z.string().min(1, 'Versão é obrigatória').max(40),
  vigenteDe: z.string().optional(),
  vigenteAte: z.string().optional(),
  ativo: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function CurriculoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cursosResponse, isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];

  const { data: turnos = [] } = useQuery({ queryKey: ['turnos'], queryFn: apiService.getTurnos });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCurriculo) => apiService.createCurriculo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculos'] });
      toast({ title: 'Currículo criado', description: 'Currículo criado com sucesso!' });
      navigate('/curriculos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao criar currículo',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  const onSubmit = (data: FormData) => {
    const payload: CreateCurriculo = {
      ...data,
      vigenteDe: data.vigenteDe || undefined,
      vigenteAte: data.vigenteAte || undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Novo Currículo" backTo="/curriculos" description="Cadastro de currículo" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Currículo</CardTitle>
              <CardDescription>Informe os dados do currículo</CardDescription>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno *</label>
                    <select
                      {...register('turnoId', { valueAsNumber: true })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.turnoId ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Selecione um turno...</option>
                      {turnos.map((t: Turno) => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                    {errors.turnoId && (
                      <p className="mt-1 text-sm text-red-600">{errors.turnoId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Versão *</label>
                    <Input
                      {...register('versao')}
                      placeholder="Ex: 2024.1, v2.0"
                      className={errors.versao ? 'border-red-500' : ''}
                    />
                    {errors.versao && (
                      <p className="mt-1 text-sm text-red-600">{errors.versao.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('ativo')}
                          defaultChecked
                          className="mr-2"
                        />
                        <span className="text-sm">Ativo</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vigência (início) — opcional</label>
                    <Input type="date" {...register('vigenteDe')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vigência (término) — opcional</label>
                    <Input type="date" {...register('vigenteAte')} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    Criar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/curriculos')}>
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
