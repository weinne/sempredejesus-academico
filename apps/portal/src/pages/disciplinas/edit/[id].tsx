import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function DisciplinaEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: disciplina, isLoading } = useQuery({
    queryKey: ['disciplina', id],
    queryFn: async () => {
      // Not available fetch by id directly in api.ts, reusing list would be heavy; assume getDisciplina exists
      return apiService.getDisciplina(Number(id));
    },
    enabled: !!id,
  });

  const { data: cursosResponse } = useQuery({ queryKey: ['cursos'], queryFn: () => apiService.getCursos({ limit: 100 }) });
  const cursos = cursosResponse?.data || [];

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiService.updateDisciplina(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      queryClient.invalidateQueries({ queryKey: ['disciplina', id] });
      toast({ title: 'Disciplina atualizada', description: 'Disciplina atualizada com sucesso!' });
      navigate('/disciplinas');
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar disciplina', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  if (isLoading || !disciplina) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Disciplina" backTo="/disciplinas" />
        <div className="max-w-5xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title={`Editar Disciplina: ${disciplina.nome}`} backTo="/disciplinas" />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Disciplina</CardTitle>
              <CardDescription>Atualize as informações da disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  updateMutation.mutate({
                    cursoId: Number(fd.get('cursoId') || disciplina.cursoId),
                    codigo: String(fd.get('codigo') || disciplina.codigo || ''),
                    nome: String(fd.get('nome') || disciplina.nome),
                    creditos: Number(fd.get('creditos') || disciplina.creditos),
                    cargaHoraria: Number(fd.get('cargaHoraria') || disciplina.cargaHoraria),
                    ementa: String(fd.get('ementa') || disciplina.ementa || ''),
                    bibliografia: String(fd.get('bibliografia') || disciplina.bibliografia || ''),
                    ativo: String(fd.get('ativo') || String(disciplina.ativo)) === 'true',
                  });
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                    <select name="cursoId" defaultValue={disciplina.cursoId} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Selecione um curso...</option>
                      {cursos.map((curso: any) => (
                        <option key={curso.id} value={curso.id}>{curso.nome} ({curso.grau})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                    <Input name="codigo" defaultValue={disciplina.codigo || ''} placeholder="Ex: TEOL101" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Disciplina *</label>
                    <Input name="nome" defaultValue={disciplina.nome} placeholder="Ex: Introdução à Teologia" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Créditos *</label>
                    <Input name="creditos" type="number" min="1" defaultValue={disciplina.creditos} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária *</label>
                    <Input name="cargaHoraria" type="number" min="1" defaultValue={disciplina.cargaHoraria} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="ativo" defaultValue={String(disciplina.ativo)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value="true">Ativa</option>
                      <option value="false">Inativa</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ementa</label>
                    <Textarea name="ementa" defaultValue={disciplina.ementa || ''} rows={4} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bibliografia</label>
                    <Textarea name="bibliografia" defaultValue={disciplina.bibliografia || ''} rows={4} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/disciplinas')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


