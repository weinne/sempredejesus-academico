import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard } from '@/components/ui/stats-card';
import { Edit, User, Mail, Phone, Calendar, Award, CheckCircle, XCircle, Clock, ArrowRight, Users, GraduationCap } from 'lucide-react';

export default function ProfessorViewPage() {
  const { matricula } = useParams<{ matricula: string }>();
  const { data: professor, isLoading } = useQuery({
    queryKey: ['professor', matricula],
    queryFn: () => apiService.getProfessor(String(matricula!)),
    enabled: !!matricula,
  });

  if (isLoading || !professor) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'INATIVO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/professores">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar aos Professores
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <Badge className={getSituacaoColor(professor.situacao)}>{professor.situacao}</Badge>
                  <h1 className="text-2xl font-bold text-gray-900">{professor.pessoa?.nome || professor.matricula}</h1>
                </div>
                <p className="text-sm text-gray-600">Matrícula: {professor.matricula}</p>
              </div>
            </div>
            <Link to={`/professores/edit/${professor.matricula}`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar Professor
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        badge="Detalhes do Professor"
        title={professor.pessoa?.nome || professor.matricula}
        description={`Professor ${professor.situacao.toLowerCase()} com ${professor.formacaoAcad ? 'formação acadêmica' : 'sem formação registrada'}`}
        stats={[
          { value: professor.matricula, label: 'Matrícula' },
          { value: professor.situacao, label: 'Situação' },
          { value: professor.dataInicio ? new Date(professor.dataInicio).getFullYear() : 'N/A', label: 'Ano de Início' },
          { value: professor.formacaoAcad ? 'Sim' : 'Não', label: 'Formação' }
        ]}
        actionLink={{
          href: '/professores',
          label: 'Ver todos os professores'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard
            title="Matrícula"
            value={professor.matricula}
            icon={User}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Situação"
            value={professor.situacao}
            icon={professor.situacao === 'ATIVO' ? CheckCircle : XCircle}
            iconColor={professor.situacao === 'ATIVO' ? 'text-green-600' : 'text-red-600'}
          />
          <StatCard
            title="Ano de Início"
            value={professor.dataInicio ? new Date(professor.dataInicio).getFullYear() : 'N/A'}
            icon={Calendar}
            iconColor="text-purple-600"
          />
          <StatCard
            title="Formação"
            value={professor.formacaoAcad ? 'Sim' : 'Não'}
            icon={GraduationCap}
            iconColor={professor.formacaoAcad ? 'text-green-600' : 'text-red-600'}
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


