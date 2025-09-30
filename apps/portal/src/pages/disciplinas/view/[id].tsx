import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard } from '@/components/ui/stats-card';
import { Edit, BookOpen, Clock, Award, CheckCircle, XCircle, ArrowRight, Users, Calendar, Hash, ArrowLeft } from 'lucide-react';

export default function DisciplinaViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: disciplina, isLoading } = useQuery({
    queryKey: ['disciplina', id],
    queryFn: () => apiService.getDisciplina(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !disciplina) {
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/disciplinas">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar às Disciplinas
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <Badge variant={disciplina.ativo ? "default" : "secondary"}>
                    {disciplina.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <h1 className="text-2xl font-bold text-gray-900">{disciplina.nome}</h1>
                </div>
                <p className="text-sm text-gray-600">Código: {disciplina.codigo}</p>
              </div>
            </div>
            <Link to={`/disciplinas/edit/${disciplina.id}`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar Disciplina
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        badge="Detalhes da Disciplina"
        title={disciplina.nome}
        description={`Disciplina ${disciplina.ativo ? 'ativa' : 'inativa'} com ${disciplina.creditos} créditos e ${disciplina.cargaHoraria}h de carga horária`}
        stats={[
          { value: disciplina.codigo, label: 'Código' },
          { value: disciplina.creditos, label: 'Créditos' },
          { value: `${disciplina.cargaHoraria}h`, label: 'Carga Horária' },
          { value: disciplina.ativo ? 'Ativa' : 'Inativa', label: 'Status' }
        ]}
        actionLink={{
          href: '/disciplinas',
          label: 'Ver todas as disciplinas'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard
            title="Código"
            value={disciplina.codigo}
            icon={Hash}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Créditos"
            value={disciplina.creditos}
            icon={Award}
            iconColor="text-green-600"
          />
          <StatCard
            title="Carga Horária"
            value={`${disciplina.cargaHoraria}h`}
            icon={Clock}
            iconColor="text-purple-600"
          />
          <StatCard
            title="Status"
            value={disciplina.ativo ? 'Ativa' : 'Inativa'}
            icon={disciplina.ativo ? CheckCircle : XCircle}
            iconColor={disciplina.ativo ? 'text-green-600' : 'text-red-600'}
          />
        </div>

        <div className="space-y-6">
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


