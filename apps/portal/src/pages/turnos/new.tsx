import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export default function TurnoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { nome: string }) => apiService.createTurno(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      toast({ title: 'Turno criado', description: 'Turno criado com sucesso!' });
      navigate('/turnos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao criar turno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  const onSubmit = (data: FormData) => {
    const nome = data.nome.trim();
    createMutation.mutate({ nome });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Novo Turno" backTo="/turnos" description="Cadastro de turno" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Turno</CardTitle>
              <CardDescription>Informe o nome do turno</CardDescription>
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
                  <Button type="submit" disabled={createMutation.isPending}>
                    Criar
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
