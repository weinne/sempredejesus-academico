import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

export default function ProfessorViewPage() {
  const { matricula } = useParams<{ matricula: string }>();
  const { data: professor, isLoading } = useQuery({
    queryKey: ['professor', matricula],
    queryFn: () => apiService.getProfessor(String(matricula!)),
    enabled: !!matricula,
  });

  if (isLoading || !professor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Detalhes do Professor" backTo="/professores" />
        <div className="max-w-4xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title={`Professor: ${professor.pessoa?.nome || professor.matricula}`}
        backTo="/professores"
        actions={
          <Link to={`/professores/edit/${professor.matricula}`}>
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
              <CardTitle>Informações</CardTitle>
              <CardDescription>Dados básicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Matrícula</div>
                  <div className="font-medium">{professor.matricula}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Nome</div>
                  <div className="font-medium">{professor.pessoa?.nome || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Situação</div>
                  <div className="font-medium">{professor.situacao}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Data de Início</div>
                  <div className="font-medium">{new Date(professor.dataInicio).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


