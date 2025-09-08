import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { CreateCurso } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(80),
  grau: z.string().min(1, 'Selecione o grau'),
});

type FormData = z.infer<typeof schema>;

export default function CursoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (curso: CreateCurso) => apiService.createCurso(curso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({ title: 'Curso criado', description: 'Curso criado com sucesso!' });
      navigate('/cursos');
    },
    onError: (error: any) => toast({ title: 'Erro ao criar curso', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Novo Curso" backTo="/cursos" description="Cadastro de curso" />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Curso</CardTitle>
              <CardDescription>Preencha as informações do curso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Curso *</label>
                    <Input {...register('nome')} placeholder="Ex: Bacharelado em Teologia" className={errors.nome ? 'border-red-500' : ''} />
                    {errors.nome && (<p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grau Acadêmico *</label>
                    <select {...register('grau')} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.grau ? 'border-red-500' : ''}`}>
                      <option value="">Selecione o grau...</option>
                      <option value="BACHARELADO">Bacharelado</option>
                      <option value="LICENCIATURA">Licenciatura</option>
                      <option value="ESPECIALIZACAO">Especialização</option>
                      <option value="MESTRADO">Mestrado</option>
                      <option value="DOUTORADO">Doutorado</option>
                    </select>
                    {errors.grau && (<p className="mt-1 text-sm text-red-600">{errors.grau.message}</p>)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/cursos')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


