import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from '@/components/ui/date-picker';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { CreateAula, Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { ArrowLeft, Save } from 'lucide-react';

const createAulaSchema = z.object({
  turmaId: z.number({ message: 'Turma é obrigatória' }).int().positive(),
  data: z.string().min(1, 'Data é obrigatória'),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:mm)').optional().or(z.literal('')),
  horaFim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:mm)').optional().or(z.literal('')),
  topico: z.string().optional(),
  materialUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  observacao: z.string().optional(),
});

type CreateAulaForm = z.infer<typeof createAulaSchema>;

export default function NovaAulaPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateAulaForm>({
    resolver: zodResolver(createAulaSchema),
  });

  const turmaId = watch('turmaId');

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

  const createMutation = useMutation({
    mutationFn: (payload: CreateAula) => apiService.createAula(payload),
    onSuccess: () => {
      toast({ title: 'Aula criada com sucesso' });
      navigate(`/aulas/list${turmaId ? `?turmaId=${turmaId}` : ''}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar aula',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateAulaForm) => {
    if (!canEdit) return;
    
    const payload: CreateAula = {
      turmaId: data.turmaId,
      data: data.data,
      horaInicio: data.horaInicio || undefined,
      horaFim: data.horaFim || undefined,
      topico: data.topico || undefined,
      materialUrl: data.materialUrl || undefined,
      observacao: data.observacao || undefined,
    };
    
    createMutation.mutate(payload);
  };

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Nova Aula" backTo="/aulas/list" />
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
      <CrudHeader title="Nova Aula" description="Cadastrar uma nova aula" backTo="/aulas/list" />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Dados da Aula</CardTitle>
              <CardDescription>Preencha as informações da aula</CardDescription>
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

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Controller
                  name="data"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value || null}
                      onChange={field.onChange}
                      placeholder="dd/mm/aaaa"
                      id="data"
                    />
                  )}
                />
                {errors.data && <p className="text-sm text-red-500">{errors.data.message}</p>}
              </div>

              {/* Horários */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Hora Início (HH:mm)</Label>
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
                  <Label htmlFor="horaFim">Hora Fim (HH:mm)</Label>
                  <Input id="horaFim" type="time" placeholder="10:00" {...register('horaFim')} />
                  {errors.horaFim && (
                    <p className="text-sm text-red-500">{errors.horaFim.message}</p>
                  )}
                </div>
              </div>

              {/* Tópico */}
              <div className="space-y-2">
                <Label htmlFor="topico">Tópico</Label>
                <Input id="topico" placeholder="Ex: Introdução à disciplina" {...register('topico')} />
              </div>

              {/* Material URL */}
              <div className="space-y-2">
                <Label htmlFor="materialUrl">Material (URL)</Label>
                <Input
                  id="materialUrl"
                  type="url"
                  placeholder="https://..."
                  {...register('materialUrl')}
                />
                {errors.materialUrl && (
                  <p className="text-sm text-red-500">{errors.materialUrl.message}</p>
                )}
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  placeholder="Observações sobre a aula"
                  {...register('observacao')}
                />
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
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

