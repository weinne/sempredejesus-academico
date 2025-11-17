import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Eye } from 'lucide-react';

export default function AulaEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: aula, isLoading } = useQuery({
    queryKey: ['aula', id],
    queryFn: () => apiService.getAula(Number(id)),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiService.updateAula(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aula', id] });
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
      toast({ title: 'Aula atualizada', description: 'Aula atualizada com sucesso!' });
      navigate('/aulas');
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar aula', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  if (isLoading || !aula) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Aula" backTo="/aulas" />
        <div className="max-w-3xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title={`Editar Aula ${aula.id}`}
        backTo="/aulas"
        actions={
          <Link to={`/aulas/view/${aula.id}`}>
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
              <CardTitle>Dados da Aula</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  updateMutation.mutate({
                    data: String(fd.get('data') || aula.data),
                    topico: String(fd.get('topico') || aula.topico || ''),
                    observacao: String(fd.get('observacao') || aula.observacao || ''),
                    materialUrl: String(fd.get('materialUrl') || aula.materialUrl || ''),
                  });
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <DatePicker
                    value={aula.data || null}
                    onChange={(value) => {
                      const form = document.querySelector('form') as HTMLFormElement;
                      if (form) {
                        const input = form.querySelector('input[name="data"]') as HTMLInputElement;
                        if (input) input.value = value || '';
                      }
                    }}
                    placeholder="dd/mm/aaaa"
                    name="data"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tópico</label>
                  <Input name="topico" defaultValue={aula.topico || ''} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material URL</label>
                  <Input name="materialUrl" defaultValue={aula.materialUrl || ''} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                  <Input name="observacao" defaultValue={aula.observacao || ''} />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/aulas')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


