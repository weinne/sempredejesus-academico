import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function ProfessorEditPage() {
  const { matricula } = useParams<{ matricula: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: professor, isLoading } = useQuery({
    queryKey: ['professor', matricula],
    queryFn: () => apiService.getProfessor(String(matricula!)),
    enabled: !!matricula,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiService.updateProfessor(String(matricula!), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      queryClient.invalidateQueries({ queryKey: ['professor', matricula] });
      toast({ title: 'Professor atualizado', description: 'Professor atualizado com sucesso!' });
      navigate('/professores');
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar professor', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  if (isLoading || !professor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Professor" backTo="/professores" />
        <div className="max-w-4xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title={`Editar Professor ${professor.matricula}`} backTo="/professores" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  updateMutation.mutate({
                    dataInicio: String(fd.get('dataInicio') || professor.dataInicio),
                    formacaoAcad: String(fd.get('formacaoAcad') || professor.formacaoAcad || ''),
                    situacao: String(fd.get('situacao') || professor.situacao),
                  });
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
                  <Input name="dataInicio" type="date" defaultValue={professor.dataInicio} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Situação *</label>
                  <select name="situacao" defaultValue={professor.situacao} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formação Acadêmica</label>
                  <Input name="formacaoAcad" defaultValue={professor.formacaoAcad || ''} placeholder="Ex: Doutorado em Teologia" />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/professores')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


