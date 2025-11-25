import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { usePageHero } from '@/hooks/use-page-hero';
import { StatCard } from '@/components/ui/stats-card';
import { Layers3, BookOpen, Users, BarChart3, Edit, ListOrdered, Calendar, Clock, CheckCircle, XCircle, ArrowRight, Award, ArrowLeft } from 'lucide-react';

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

  // Configure Hero via hook (must be called before early returns)
  usePageHero({
    title: periodo?.nome || periodo?.numero ? `Período ${periodo.numero}` : 'Carregando...',
    description: periodo ? `Período acadêmico do curso ${periodo.curso?.nome || 'N/A'} com disciplinas e estrutura curricular` : 'Carregando detalhes do período',
    backTo: "/periodos",
    stats: periodo ? [
      { value: periodo.numero, label: 'Número' },
      { value: periodo.curso?.nome || 'N/A', label: 'Curso' }
    ] : [],
    actionLink: {
      href: '/periodos',
      label: 'Ver todos os períodos'
    },
    actions: periodo && canEdit ? (
      <Link to={`/periodos/edit/${periodo.id}`}>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Editar Período
        </Button>
      </Link>
    ) : undefined
  });

  if (isLoading || !periodo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <StatCard
            title="Número"
            value={periodo.numero}
            icon={Award}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Curso"
            value={periodo.curso?.nome || 'N/A'}
            icon={BookOpen}
            iconColor="text-green-600"
          />
        </div>

        <div className="space-y-6">
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
                <div>
                  <div className="text-sm text-muted-foreground">Currículo</div>
                  {periodo.curriculo ? (
                    <div className="flex items-center gap-2 font-medium">
                      <Layers3 className="h-4 w-4 text-primary" />
                      <span>{periodo.curriculo.versao}</span>
                    </div>
                  ) : (
                    <div className="font-medium">—</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Turno</div>
                  {periodo.turno ? (
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{periodo.turno.nome}</span>
                    </div>
                  ) : (
                    <div className="font-medium">—</div>
                  )}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Disciplinas Vinculadas
              </CardTitle>
              <CardDescription>Disciplinas alocadas neste período, com ordem e obrigatoriedade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {periodo.disciplinas && periodo.disciplinas.length > 0 ? (
                periodo.disciplinas.map((disciplina) => (
                  <div
                    key={disciplina.id}
                    className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm uppercase text-slate-500">{disciplina.codigo}</div>
                      <div className="text-base font-semibold text-slate-800">{disciplina.nome}</div>
                      <div className="text-xs text-slate-500">
                        {disciplina.cargaHoraria}h · {disciplina.creditos} créditos
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={disciplina.obrigatoria !== false ? 'default' : 'secondary'}>
                        {disciplina.obrigatoria !== false ? 'Obrigatoria' : 'Optativa'}
                      </Badge>
                      {disciplina.ordem ? (
                        <Badge variant="outline">Ordem {disciplina.ordem}</Badge>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhuma disciplina vinculada a este período.</p>
              )}
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
