import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard } from '@/components/ui/stats-card';
import {
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  User, 
  Clock, 
  MapPin,
  Users,
  GraduationCap,
  Mail,
  Phone,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  ArrowRight,
  Edit
} from 'lucide-react';
import type { Disciplina } from '@/types/api';

export default function TurmaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getDisciplinaPeriodoLabel = (disciplina?: Disciplina) => {
    if (!disciplina || !Array.isArray(disciplina.periodos) || disciplina.periodos.length === 0) {
      return 'Nenhum período vinculado';
    }
    const vinculo = disciplina.periodos[0];
    const periodo = vinculo.periodo;
    if (periodo) {
      return periodo.nome || (periodo.numero !== undefined ? `Período ${periodo.numero}` : `Período ${vinculo.periodoId}`);
    }
    return `Período ${vinculo.periodoId}`;
  };

  const {
    data: turma,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['turma', id],
    queryFn: () => apiService.getTurma(Number(id!)),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  if (error || !turma) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 py-4">
              <Link to="/turmas">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalhes da Turma</h1>
                <p className="text-sm text-gray-600">ID: {id}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Turma não encontrada</h2>
              <p className="text-gray-600">Não foi possível carregar os dados da turma com ID {id}.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Semestre removido; exibiremos período da disciplina

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/turmas">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar às Turmas
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {turma.secao ? `Seção ${turma.secao}` : 'Turma'}
                  </Badge>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {turma.disciplina?.nome || 'Disciplina não informada'}
                  </h1>
                </div>
                <p className="text-sm text-gray-600">
                  Código: {turma.disciplina?.codigo || 'N/A'}
                </p>
              </div>
            </div>
            <Link to={`/turmas/edit/${turma.id}`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar Turma
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        badge="Detalhes da Turma"
        title={turma.disciplina?.nome || 'Disciplina não informada'}
        description={`Turma ${turma.secao ? `seção ${turma.secao}` : 'única'} da disciplina ${turma.disciplina?.codigo || 'N/A'}`}
        stats={[
          { value: turma.disciplina?.codigo || 'N/A', label: 'Código' },
          { value: turma.secao || 'Única', label: 'Seção' },
          { value: turma.sala || 'N/A', label: 'Sala' },
          { value: turma.horario || 'N/A', label: 'Horário' }
        ]}
        actionLink={{
          href: '/turmas',
          label: 'Ver todas as turmas'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard
            title="Código"
            value={turma.disciplina?.codigo || 'N/A'}
            icon={BookOpen}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Seção"
            value={turma.secao || 'Única'}
            icon={Users}
            iconColor="text-green-600"
          />
          <StatCard
            title="Sala"
            value={turma.sala || 'N/A'}
            icon={MapPin}
            iconColor="text-purple-600"
          />
          <StatCard
            title="Horário"
            value={turma.horario || 'N/A'}
            icon={Clock}
            iconColor="text-orange-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações da Disciplina */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {turma.disciplina?.nome || 'Disciplina não informada'}
                    </CardTitle>
                    <CardDescription>
                      Código: {turma.disciplina?.codigo || 'N/A'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Créditos</p>
                      <p className="font-medium">{turma.disciplina?.creditos || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Carga Horária</p>
                      <p className="font-medium">{turma.disciplina?.cargaHoraria || 'N/A'}h</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Período (disciplina)</p>
                      <p className="font-medium">{getDisciplinaPeriodoLabel(turma.disciplina)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Alunos Matriculados</p>
                      <p className="font-medium">{turma.totalInscritos || 0}</p>
                    </div>
                  </div>
                </div>

                {turma.disciplina?.ementa && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-2">Ementa</h4>
                    <p className="text-sm text-gray-600">{turma.disciplina.ementa}</p>
                  </div>
                )}

                {turma.disciplina?.bibliografia && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-2">Bibliografia</h4>
                    <p className="text-sm text-gray-600">{turma.disciplina.bibliografia}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações do Professor */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Professor</CardTitle>
                    <CardDescription>Responsável pela disciplina</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Nome</p>
                      <p className="font-medium">
                        {turma.professor?.pessoa?.nome || 'Professor não informado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Matrícula</p>
                      <p className="font-medium">{turma.professor?.matricula || 'N/A'}</p>
                    </div>
                  </div>

                  {turma.professor?.pessoa?.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{turma.professor.pessoa.email}</p>
                      </div>
                    </div>
                  )}

                  {turma.professor?.pessoa?.telefone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium">{turma.professor.pessoa.telefone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {turma.professor?.formacaoAcad && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-2">Formação Acadêmica</h4>
                    <p className="text-sm text-gray-600">{turma.professor.formacaoAcad}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de Alunos Matriculados */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Alunos Matriculados</CardTitle>
                    <CardDescription>
                      {turma.totalInscritos || 0} alunos inscritos nesta turma
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {turma.inscritos && turma.inscritos.length > 0 ? (
                  <div className="space-y-3">
                    {turma.inscritos.map((inscrito) => (
                      <div key={inscrito.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {inscrito.aluno?.pessoa?.nome || 'Nome não informado'}
                            </p>
                            <p className="text-sm text-gray-500">RA: {inscrito.alunoId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            inscrito.status === 'MATRICULADO' ? 'bg-green-100 text-green-800' :
                            inscrito.status === 'APROVADO' ? 'bg-blue-100 text-blue-800' :
                            inscrito.status === 'REPROVADO' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {inscrito.status}
                          </span>
                          {inscrito.media && (
                            <p className="text-sm text-gray-500 mt-1">
                              Média: {inscrito.media}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum aluno matriculado nesta turma</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com Informações Rápidas */}
          <div className="space-y-6">
            {/* Informações da Turma */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Informações da Turma</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/turmas/inscricoes/${turma.id}`)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                    Gerenciar alunos
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-medium">{turma.id}</span>
                  </div>
                  
                  {turma.sala && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sala:</span>
                      <span className="font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {turma.sala}
                      </span>
                    </div>
                  )}

                  {turma.horario && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Horário:</span>
                      <span className="font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {turma.horario}
                      </span>
                    </div>
                  )}

                  {turma.secao && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Seção:</span>
                      <span className="font-medium">{turma.secao}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Situação:</span>
                    <span className="font-medium text-green-600">Ativa</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {turma.totalInscritos || 0}
                    </div>
                    <p className="text-sm text-gray-500">Alunos matriculados</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">
                        {turma.disciplina?.creditos || '-'}
                      </div>
                      <p className="text-xs text-gray-500">Créditos</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">
                        {turma.disciplina?.cargaHoraria || '-'}h
                      </div>
                      <p className="text-xs text-gray-500">Carga Horária</p>
                    </div>
                  </div>

                  {turma.inscritos && turma.inscritos.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-3">Status dos Alunos</h4>
                      <div className="space-y-2">
                        {['MATRICULADO', 'APROVADO', 'REPROVADO', 'CANCELADO'].map((status) => {
                          const count = turma.inscritos?.filter(i => i.status === status).length || 0;
                          const percentage = turma.inscritos?.length ? (count / turma.inscritos.length * 100).toFixed(0) : '0';
                          
                          if (count === 0) return null;
                          
                          return (
                            <div key={status} className="flex justify-between text-sm">
                              <span className="text-gray-500">{status}:</span>
                              <span className="font-medium">{count} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/turmas/inscricoes/${turma.id}`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Alunos
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/avaliacoes?turmaId=${turma.id}`)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Lançar Notas
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/aulas?turmaId=${turma.id}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Frequência
                </Button>
                <Link to={`/turmas/edit/${turma.id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Turma
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}