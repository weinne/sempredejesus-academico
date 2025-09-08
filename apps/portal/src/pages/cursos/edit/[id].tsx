import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

export default function CursoEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: curso, isLoading } = useQuery({
    queryKey: ['curso', id],
    queryFn: () => apiService.getCurso(Number(id)),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiService.updateCurso(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', id] });
      toast({ title: 'Curso atualizado', description: 'Curso atualizado com sucesso!' });
      navigate('/cursos');
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar curso', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  if (isLoading || !curso) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Curso" backTo="/cursos" />
        <div className="max-w-3xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title={`Editar Curso: ${curso.nome}`}
        backTo="/cursos"
        actions={
          <Link to={`/cursos/view/${curso.id}`}>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Ver
            </Button>
          </Link>
        }
      />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Curso</CardTitle>
              <CardDescription>Atualize as informações do curso</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  updateMutation.mutate({
                    nome: String(fd.get('nome') || curso.nome),
                    grau: String(fd.get('grau') || curso.grau),
                  });
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Curso *</label>
                  <Input name="nome" defaultValue={curso.nome} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grau Acadêmico *</label>
                  <select name="grau" defaultValue={curso.grau} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="BACHARELADO">Bacharelado</option>
                    <option value="LICENCIATURA">Licenciatura</option>
                    <option value="ESPECIALIZACAO">Especialização</option>
                    <option value="MESTRADO">Mestrado</option>
                    <option value="DOUTORADO">Doutorado</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
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


