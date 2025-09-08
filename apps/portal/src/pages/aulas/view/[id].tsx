import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

export default function AulaViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: aula, isLoading } = useQuery({
    queryKey: ['aula', id],
    queryFn: () => apiService.getAula(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !aula) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Detalhes da Aula" backTo="/aulas" />
        <div className="max-w-3xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title={`Aula ${aula.id}`}
        backTo="/aulas"
        actions={
          <Link to={`/aulas/edit/${aula.id}`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        }
      />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
              <CardDescription>Dados da aula</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Data</div>
                  <div className="font-medium">{aula.data}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tópico</div>
                  <div className="font-medium">{aula.topico || '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-muted-foreground">Observação</div>
                  <div className="font-medium">{aula.observacao || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


