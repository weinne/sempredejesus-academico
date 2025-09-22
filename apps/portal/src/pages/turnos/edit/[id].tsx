import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Turno } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(30),
});

type FormData = z.infer<typeof schema>;

export default function TurnoEditPage() {
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

  const {
    data: turno,
    isLoading,
  } = useQuery({
    queryKey: ['turno', id],
    queryFn: () => apiService.getTurnos().then(turnos => turnos.find(t => t.id === Number(id))),
    enabled: !!id,
  });

  useEffect(() => {
    if (turno) {
      reset({
        nome: turno.nome,
      });
    }
  }, [turno, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<{ nome: string }>) => apiService.updateTurno(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      toast({ title: 'Turno atualizado', description: 'Turno atualizado com sucesso!' });
      navigate('/turnos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao atualizar turno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  const onSubmit = (data: FormData) => {
    const nome = data.nome.trim();
    updateMutation.mutate({ nome });
  };

  if (isLoading || !turno) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Turno" backTo="/turnos" />
        <div className="max-w-4xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title={`Editar Turno ${turno.nome}`} backTo="/turnos" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Atualização do Turno</CardTitle>
              <CardDescription>Altere o nome do turno selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Turno *</label>
                    <Input
                      {...register('nome')}
                      placeholder="Ex: Diurno, Vespertino, Noturno"
                      className={errors.nome ? 'border-red-500' : ''}
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    Salvar alterações
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/turnos')}>
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
