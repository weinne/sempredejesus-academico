import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { AulasBatch, AulasBatchResponse, Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { ArrowLeft, Eye, Plus } from 'lucide-react';

const batchSchema = z.object({
  turmaId: z.number({ required_error: 'Turma é obrigatória' }).int().positive(),
  diaDaSemana: z.number({ required_error: 'Dia da semana é obrigatório' }).int().min(0).max(6),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:mm)'),
  horaFim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:mm)'),
  pularFeriados: z.boolean().optional(),
});

type BatchForm = z.infer<typeof batchSchema>;

const diasDaSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export default function AulasBatchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);

  const [preview, setPreview] = useState<AulasBatchResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      pularFeriados: false,
    },
  });

  const turmaId = watch('turmaId');
  const pularFeriados = watch('pularFeriados');

  // Initialize turmaId from URL params
  useEffect(() => {
    const turmaIdParam = searchParams.get('turmaId');
    if (turmaIdParam) {
      setValue('turmaId', Number(turmaIdParam));
    }
  }, [searchParams, setValue]);

  // Fetch turmas for dropdown
  const { data: turmasOptions = [] } = useQuery({
    queryKey: ['turmas-options'],
    queryFn: () => apiService.getTurmas({ limit: 1000 }).then((r) => r.data),
  });

  // Pre-fill dates from periodo if turma is selected
  const { data: turmaData } = useQuery({
    queryKey: ['turma-detail', turmaId],
    queryFn: async () => {
      const turmas = await apiService.getTurmas({ limit: 1000 });
      return turmas.data.find((t: any) => t.id === turmaId);
    },
    enabled: !!turmaId,
  });

  useEffect(() => {
    if (turmaData && turmaData.disciplina?.periodo) {
      const periodo = turmaData.disciplina.periodo;
      // Periodo may have dataInicio/dataFim properties if available in the API response
      if ((periodo as any).dataInicio) setValue('dataInicio', (periodo as any).dataInicio);
      if ((periodo as any).dataFim) setValue('dataFim', (periodo as any).dataFim);
    }
  }, [turmaData, setValue]);

  const previewMutation = useMutation({
    mutationFn: (payload: AulasBatch) => apiService.createAulasBatch({ ...payload, dryRun: true }),
    onSuccess: (data) => {
      setPreview(data);
      toast({ title: 'Pré-visualização gerada' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar pré-visualização',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: AulasBatch) => apiService.createAulasBatch({ ...payload, dryRun: false }),
    onSuccess: () => {
      toast({ title: 'Aulas criadas com sucesso' });
      navigate(`/aulas/list${turmaId ? `?turmaId=${turmaId}` : ''}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar aulas',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onPreview = (data: BatchForm) => {
    if (!canEdit) return;
    const payload: AulasBatch = {
      ...data,
      pularFeriados: data.pularFeriados || false,
      dryRun: true,
    };
    previewMutation.mutate(payload);
  };

  const onCreate = () => {
    if (!canEdit || !preview) return;
    handleSubmit((data) => {
      const payload: AulasBatch = {
        ...data,
        pularFeriados: data.pularFeriados || false,
        dryRun: false,
      };
      createMutation.mutate(payload);
    })();
  };

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Criar Aulas em Lote" backTo="/aulas/list" />
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                Você não tem permissão para criar aulas.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title="Criar Aulas em Lote"
        description="Criar aulas recorrentes em um período"
        backTo="/aulas/list"
      />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <form onSubmit={handleSubmit(onPreview)}>
          <Card>
            <CardHeader>
              <CardTitle>Configuração da Recorrência</CardTitle>
              <CardDescription>Defina o período e a recorrência das aulas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Turma */}
              <div className="space-y-2">
                <Label htmlFor="turmaId">Turma *</Label>
                <select
                  id="turmaId"
                  className="w-full border rounded px-3 py-2"
                  {...register('turmaId', { valueAsNumber: true })}
                >
                  <option value="">Selecione a turma</option>
                  {turmasOptions.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.id} - {t.disciplina?.nome || 'Turma'} (
                      {t.professor?.pessoa?.nome || 'Prof. não definido'})
                    </option>
                  ))}
                </select>
                {errors.turmaId && (
                  <p className="text-sm text-red-500">{errors.turmaId.message}</p>
                )}
              </div>

              {/* Dia da semana */}
              <div className="space-y-2">
                <Label htmlFor="diaDaSemana">Dia da Semana *</Label>
                <select
                  id="diaDaSemana"
                  className="w-full border rounded px-3 py-2"
                  {...register('diaDaSemana', { valueAsNumber: true })}
                >
                  <option value="">Selecione o dia</option>
                  {diasDaSemana.map((dia) => (
                    <option key={dia.value} value={dia.value}>
                      {dia.label}
                    </option>
                  ))}
                </select>
                {errors.diaDaSemana && (
                  <p className="text-sm text-red-500">{errors.diaDaSemana.message}</p>
                )}
              </div>

              {/* Período */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início *</Label>
                  <Input id="dataInicio" type="date" {...register('dataInicio')} />
                  {errors.dataInicio && (
                    <p className="text-sm text-red-500">{errors.dataInicio.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim *</Label>
                  <Input id="dataFim" type="date" {...register('dataFim')} />
                  {errors.dataFim && (
                    <p className="text-sm text-red-500">{errors.dataFim.message}</p>
                  )}
                </div>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Hora Início (HH:mm) *</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    placeholder="08:00"
                    {...register('horaInicio')}
                  />
                  {errors.horaInicio && (
                    <p className="text-sm text-red-500">{errors.horaInicio.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaFim">Hora Fim (HH:mm) *</Label>
                  <Input id="horaFim" type="time" placeholder="10:00" {...register('horaFim')} />
                  {errors.horaFim && (
                    <p className="text-sm text-red-500">{errors.horaFim.message}</p>
                  )}
                </div>
              </div>

              {/* Pular feriados */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pularFeriados"
                  checked={pularFeriados}
                  onCheckedChange={(checked) => setValue('pularFeriados', !!checked)}
                />
                <Label htmlFor="pularFeriados" className="cursor-pointer">
                  Pular feriados do calendário
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/aulas/list${turmaId ? `?turmaId=${turmaId}` : ''}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" variant="outline" disabled={previewMutation.isPending}>
              <Eye className="h-4 w-4 mr-2" />
              {previewMutation.isPending ? 'Gerando...' : 'Pré-visualizar'}
            </Button>
          </div>
        </form>

        {/* Preview */}
        {preview && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>
                {preview.totalGeradas} aula(s) será(ão) criada(s)
                {preview.existentesIgnoradas ? ` (${preview.existentesIgnoradas} já existente(s) ignorada(s))` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preview.datas && preview.datas.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium">Datas das aulas:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {preview.datas.map((data) => {
                      const date = new Date(data);
                      return (
                        <div
                          key={data}
                          className="p-2 bg-gray-50 border border-gray-200 rounded text-sm"
                        >
                          {date.toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button onClick={onCreate} disabled={createMutation.isPending}>
                      <Plus className="h-4 w-4 mr-2" />
                      {createMutation.isPending ? 'Criando...' : 'Criar Aulas'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  Nenhuma aula nova para criar (todas as datas já possuem aulas cadastradas).
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

