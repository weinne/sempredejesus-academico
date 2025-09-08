import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Edit } from 'lucide-react';

export default function CursoViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: curso, isLoading } = useQuery({
    queryKey: ['curso', id],
    queryFn: () => apiService.getCurso(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !curso) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Detalhes do Curso" backTo="/cursos" />
        <div className="max-w-4xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title={`Curso: ${curso.nome}`}
        backTo="/cursos"
        actions={
          <Link to={`/cursos/edit/${curso.id}`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        }
      />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Curso</CardTitle>
              <CardDescription>Dados básicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Nome</div>
                  <div className="font-medium">{curso.nome}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Grau</div>
                  <div className="font-medium">{curso.grau}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


