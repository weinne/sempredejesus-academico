import React, { useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import CrudHeader from '@/components/crud/crud-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { Curso, CreateCoorte, Turno, Curriculo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  turnoId: z.number().min(1, 'Selecione um turno'),
  curriculoId: z.number().min(1, 'Selecione um currículo'),
  anoIngresso: z.number().min(1900, 'Ano inválido').max(2100, 'Ano inválido'),
  rotulo: z.string().min(2, 'Informe um rótulo'),
  ativo: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function CoorteEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: coorte, isLoading: isLoadingCoorte } = useQuery({
    queryKey: ['coorte', id],
    queryFn: () => apiService.getCoorte(Number(id)),
    enabled: !!id,
    retry: false,
  });

  const { data: cursosResponse } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];

  const {
    data: turnos = [],
  } = useQuery({ queryKey: ['turnos'], queryFn: () => apiService.getTurnos() });

  const { data: curriculosResponse } = useQuery({
    queryKey: ['curriculos'],
    queryFn: () => apiService.getCurriculos(),
  });
  const curriculos = curriculosResponse || [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ativo: true },
  });

  const selectedCursoId = watch('cursoId');
  const selectedTurnoId = watch('turnoId');

  // Preencher formulário quando coorte carregar
  useEffect(() => {
    if (coorte) {
      setValue('cursoId', coorte.cursoId);
      setValue('turnoId', coorte.turnoId);
      setValue('curriculoId', coorte.curriculoId);
      setValue('anoIngresso', coorte.anoIngresso);
      setValue('rotulo', coorte.rotulo);
      setValue('ativo', coorte.ativo);
    }
  }, [coorte, setValue]);

  const curriculosDisponiveis = useMemo(() => {
    if (!selectedCursoId || !selectedTurnoId) return [];
    return curriculos.filter(
      (curriculo) => curriculo.cursoId === selectedCursoId && curriculo.turnoId === selectedTurnoId,
    );
  }, [curriculos, selectedCursoId, selectedTurnoId]);

  const updateMutation = useMutation({
    mutationFn: (payload: CreateCoorte) => apiService.updateCoorte(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coortes'] });
      queryClient.invalidateQueries({ queryKey: ['coorte', id] });
      toast({ title: 'Coorte atualizada', description: 'Coorte atualizada com sucesso!' });
      navigate('/coortes');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar coorte',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  if (isLoadingCoorte) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!coorte) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Coorte" backTo="/coortes" description="Edição de coorte" />
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Coorte não encontrada</h2>
              <p className="text-gray-600">Não foi possível carregar os dados da coorte.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Editar Coorte" backTo="/coortes" description="Edição de coorte" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados da coorte</CardTitle>
              <CardDescription>Informe curso, turno, currículo e demais detalhes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                    <select
                      {...register('cursoId', { valueAsNumber: true })}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.cursoId ? 'border-red-500' : ''
                      }`}
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
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.turnoId ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Selecione um turno...</option>
                      {turnos.map((turno: Turno) => (
                        <option key={turno.id} value={turno.id}>
                          {turno.nome}
                        </option>
                      ))}
                    </select>
                    {errors.turnoId && (
                      <p className="mt-1 text-sm text-red-600">{(errors as any).turnoId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currículo *</label>
                    <select
                      {...register('curriculoId', { valueAsNumber: true })}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.curriculoId ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">
                        {selectedCursoId && selectedTurnoId
                          ? curriculosDisponiveis.length
                            ? 'Selecione um currículo...'
                            : 'Nenhum currículo disponível'
                          : 'Selecione curso e turno primeiro'}
                      </option>
                      {curriculosDisponiveis.map((curriculo: Curriculo) => (
                        <option key={curriculo.id} value={curriculo.id}>
                          {curriculo.versao} ({curriculo.ativo ? 'Ativo' : 'Inativo'})
                        </option>
                      ))}
                    </select>
                    {errors.curriculoId && (
                      <p className="mt-1 text-sm text-red-600">{(errors as any).curriculoId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ano de ingresso *</label>
                    <Input
                      type="number"
                      placeholder="Ex: 2025"
                      {...register('anoIngresso', { valueAsNumber: true })}
                      className={errors.anoIngresso ? 'border-red-500' : ''}
                    />
                    {errors.anoIngresso && (
                      <p className="mt-1 text-sm text-red-600">{errors.anoIngresso.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rótulo *</label>
                    <Input
                      placeholder="Ex: 2025/1"
                      {...register('rotulo')}
                      className={errors.rotulo ? 'border-red-500' : ''}
                    />
                    {errors.rotulo && (
                      <p className="mt-1 text-sm text-red-600">{errors.rotulo.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 mt-6">
                    <Controller
                      name="ativo"
                      control={control}
                      render={({ field }) => (
                        <input
                          id="ativo"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      )}
                    />
                    <label htmlFor="ativo" className="text-sm text-gray-700">
                      Coorte ativa?
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    Salvar alterações
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/coortes')}>
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


