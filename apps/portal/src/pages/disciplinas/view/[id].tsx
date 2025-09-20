import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

export default function DisciplinaViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: disciplina, isLoading } = useQuery({
    queryKey: ['disciplina', id],
    queryFn: () => apiService.getDisciplina(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !disciplina) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Detalhes da Disciplina" backTo="/disciplinas" />
        <div className="max-w-5xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title={`Disciplina: ${disciplina.nome}`}
        backTo="/disciplinas"
        actions={
          <Link to={`/disciplinas/edit/${disciplina.id}`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        }
      />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
              <CardDescription>Dados básicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Código</div>
                  <div className="font-medium">{disciplina.codigo || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Nome</div>
                  <div className="font-medium">{disciplina.nome}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Créditos</div>
                  <div className="font-medium">{disciplina.creditos}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Carga Horária</div>
                  <div className="font-medium">{disciplina.cargaHoraria}h</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Curso</div>
                  <div className="font-medium">{disciplina.curso?.nome || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Período</div>
                  <div className="font-medium">
                    {disciplina.periodo
                      ? disciplina.periodo.nome || `Período ${disciplina.periodo.numero}`
                      : '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


