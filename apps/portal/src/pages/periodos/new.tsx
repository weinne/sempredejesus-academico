import React, { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  curriculoId: z.number().min(1, 'Selecione um curriculo'),
  numero: z.number().min(1, 'Informe o numero do periodo').max(255),
  nome: z.string().max(80).optional(),
  descricao: z.string().max(500).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
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
  const { data: turnos = [] } = useQuery({ queryKey: ['turnos'], queryFn: () => apiService.getTurnos() });
  const { data: curriculos = [] } = useQuery({ queryKey: ['curriculos'], queryFn: () => apiService.getCurriculos() });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedCursoId = watch('cursoId');
  const selectedTurnoId = watch('turnoId');
  const selectedCurriculoId = watch('curriculoId');

  const curriculosDisponiveis = useMemo(() => {
    if (!selectedCursoId) {
      return [] as Curriculo[];
    }
    return curriculos.filter((curriculo) => curriculo.cursoId === selectedCursoId);
  }, [curriculos, selectedCursoId]);

  const turnosDisponiveis = useMemo(() => {
    if (!selectedCursoId) {
      return turnos;
    }
    const turnoIds = new Set(curriculosDisponiveis.map((curriculo) => curriculo.turnoId));
    return turnos.filter((turno) => turnoIds.has(turno.id));
  }, [selectedCursoId, curriculosDisponiveis, turnos]);

  useEffect(() => {
    if (!selectedCursoId) {
      if (selectedTurnoId) {
        setValue('turnoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
      }
      if (selectedCurriculoId) {
        setValue('curriculoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
      }
      return;
    }

    if (selectedTurnoId && !turnosDisponiveis.some((turno) => turno.id === selectedTurnoId)) {
      setValue('turnoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
    } else if (!selectedTurnoId && turnosDisponiveis.length === 1) {
      setValue('turnoId', turnosDisponiveis[0].id, { shouldDirty: false, shouldValidate: false });
    }

    if (selectedCurriculoId && !curriculosDisponiveis.some((curriculo) => curriculo.id === selectedCurriculoId)) {
      setValue('curriculoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
    } else if (!selectedCurriculoId && curriculosDisponiveis.length === 1) {
      setValue('curriculoId', curriculosDisponiveis[0].id, { shouldDirty: false, shouldValidate: false });
    }
  }, [selectedCursoId, selectedTurnoId, selectedCurriculoId, turnosDisponiveis, curriculosDisponiveis, setValue]);



  const createMutation = useMutation({
    mutationFn: (payload: CreatePeriodo) => apiService.createPeriodo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      toast({ title: 'Periodo criado', description: 'Periodo criado com sucesso!' });
      navigate('/periodos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao criar periodo',
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
      <CrudHeader title="Novo periodo" backTo="/periodos" description="Cadastro de periodo" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados do periodo</CardTitle>
              <CardDescription>Informe curso, turno, curriculo e os detalhes do periodo</CardDescription>
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
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedCursoId ? 'Curso selecionado. Ajuste turno e curriculo logo abaixo.' : 'Escolha um curso para liberar as demais opcoes.'}
                    </p>
                    {errors.cursoId && (
                      <p className="mt-1 text-sm text-red-600">{errors.cursoId.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">numero do periodo *</label>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno *</label>
                    <select
                      {...register('turnoId', { valueAsNumber: true })}
                      disabled={!selectedCursoId || turnosDisponiveis.length === 0}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        (errors as any).turnoId ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">{selectedCursoId ? (turnosDisponiveis.length ? 'Selecione um turno...' : 'Nenhum turno disponivel') : 'Selecione um curso primeiro'}</option>
                      {turnosDisponiveis.map((turno: Turno) => (
                        <option key={turno.id} value={turno.id}>{turno.nome}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedCursoId ? (turnosDisponiveis.length ? `${turnosDisponiveis.length} turno(s) disponiveis.` : 'Nenhum turno associado ao curso selecionado.') : 'Selecione um curso para habilitar os turnos.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curriculo *</label>
                    <select
                      {...register('curriculoId', { valueAsNumber: true })}
                      disabled={!selectedCursoId || curriculosDisponiveis.length === 0}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        (errors as any).curriculoId ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">{selectedCursoId ? (curriculosDisponiveis.length ? 'Selecione um curriculo...' : 'Nenhum curriculo cadastrado') : 'Selecione um curso primeiro'}</option>
                      {curriculosDisponiveis.map((curriculo: Curriculo) => (
                        <option key={curriculo.id} value={curriculo.id}>{curriculo.versao} ({curriculo.ativo ? 'Ativo' : 'Inativo'})</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedCursoId ? (curriculosDisponiveis.length ? `${curriculosDisponiveis.length} curriculo(s) encontrados.` : 'Nenhum curriculo cadastrado para este curso.') : 'Escolha um curso para listar os curriculos.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do periodo (opcional)</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descricao (opcional)</label>
                    <Textarea
                      {...register('descricao')}
                      rows={4}
                      placeholder="Detalhes adicionais sobre este periodo"
                      className={errors.descricao ? 'border-red-500' : ''}
                    />
                    {errors.descricao && (
                      <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de início (opcional)</label>
                    <Input type="date" {...register('dataInicio')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de término (opcional)</label>
                    <Input type="date" {...register('dataFim')} />
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











