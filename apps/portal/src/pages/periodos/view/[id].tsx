import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { Layers3, BookOpen, Users, BarChart3, Edit, ListOrdered } from 'lucide-react';

export default function PeriodoViewPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  const {
    data: periodo,
    isLoading,
  } = useQuery({
    queryKey: ['periodo', id],
    queryFn: () => apiService.getPeriodo(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !periodo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Detalhes do Período" backTo="/periodos" />
        <div className="max-w-4xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title={periodo.nome ? `Período: ${periodo.nome}` : `Período ${periodo.numero}`}
        backTo="/periodos"
        actions={
          canEdit ? (
            <Link to={`/periodos/edit/${periodo.id}`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
          ) : undefined
        }
      />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5" />
                Informações do Período
              </CardTitle>
              <CardDescription>Dados gerais e vínculo com o curso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Número</div>
                  <div className="font-medium">Período {periodo.numero}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Curso associado</div>
                  {periodo.curso ? (
                    <div className="flex items-center gap-2 font-medium">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <Link to={`/cursos/view/${periodo.curso.id}`} className="text-primary hover:underline">
                        {periodo.curso.nome}
                      </Link>
                    </div>
                  ) : (
                    <div className="font-medium">Curso não informado</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Grau</div>
                  <div className="font-medium">
                    {periodo.curso?.grau || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Nome</div>
                  <div className="font-medium">{periodo.nome || '—'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="h-5 w-5" />
                Estatísticas
              </CardTitle>
              <CardDescription>Resumo de disciplinas e alunos vinculados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2 p-3 rounded-md border">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">Disciplinas</div>
                    <div className="text-lg font-semibold">{Number(periodo.totalDisciplinas ?? 0)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-md border">
                  <Users className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">Alunos</div>
                    <div className="text-lg font-semibold">{Number(periodo.totalAlunos ?? 0)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-md border">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-xs uppercase text-gray-500">Curso</div>
                    <div className="text-lg font-semibold">{periodo.curso?.nome || '—'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {periodo.descricao && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
                <CardDescription>Informações adicionais sobre o período</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{periodo.descricao}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
