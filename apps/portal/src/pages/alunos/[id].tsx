import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Role } from '@/types/api';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard } from '@/components/ui/stats-card';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Award,
  School,
  CreditCard,
  TrendingUp,
  Edit,
  MoreHorizontal,
  Layers3,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Users
} from 'lucide-react';

export default function AlunoDetailPage() {
  const { ra } = useParams<{ ra: string }>();
  const { hasRole } = useAuth();

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  const {
    data: aluno,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['aluno', ra],
    queryFn: () => apiService.getAluno(ra!),
    enabled: !!ra,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !aluno) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 py-4">
              <Link to="/alunos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Alunos
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalhes do Aluno</h1>
                <p className="text-sm text-gray-600">RA: {ra}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Aluno não encontrado</h2>
              <p className="text-gray-600">Não foi possível carregar os dados do aluno com RA {ra}.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'TRANCADO': return 'bg-yellow-100 text-yellow-800';
      case 'CONCLUIDO': return 'bg-blue-100 text-blue-800';
      case 'CANCELADO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/alunos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Alunos
                </Button>
              </Link>
              <div>
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <Link to="/alunos" className="hover:text-gray-700">Alunos</Link>
                  <span>/</span>
                  <span className="text-gray-900">{aluno.pessoa?.nome || aluno.ra}</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">Detalhes do Aluno</h1>
                <p className="text-sm text-gray-600">RA: {aluno.ra}</p>
              </div>
            </div>
            {canEdit && (
              <div className="flex space-x-2">
                <Link to={`/alunos/edit/${aluno.ra}`}>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        badge="Detalhes do Aluno"
        title={aluno.pessoa.nome}
        description={`Aluno ${aluno.situacao.toLowerCase()} do curso ${aluno.curso?.nome || 'N/A'}`}
        stats={[
          { value: aluno.ra, label: 'RA' },
          { value: aluno.situacao, label: 'Situação' },
          { value: aluno.anoIngresso, label: 'Ano de Ingresso' },
          { value: aluno.coeficienteAcad || 'N/A', label: 'Coeficiente' }
        ]}
        actionLink={{
          href: '/alunos',
          label: 'Ver todos os alunos'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard
            title="RA"
            value={aluno.ra}
            icon={User}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Situação"
            value={aluno.situacao}
            icon={aluno.situacao === 'ATIVO' ? CheckCircle : XCircle}
            iconColor={aluno.situacao === 'ATIVO' ? 'text-green-600' : 'text-red-600'}
          />
          <StatCard
            title="Ano de Ingresso"
            value={aluno.anoIngresso}
            icon={Calendar}
            iconColor="text-purple-600"
          />
          <StatCard
            title="Coeficiente"
            value={aluno.coeficienteAcad || 'N/A'}
            icon={TrendingUp}
            iconColor="text-orange-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {aluno.pessoa?.nome || 'Nome não informado'}
                    </CardTitle>
                    <CardDescription>Informações pessoais e de contato</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aluno.pessoa?.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{aluno.pessoa.email}</p>
                      </div>
                    </div>
                  )}

                  {aluno.pessoa?.telefone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium">{aluno.pessoa.telefone}</p>
                      </div>
                    </div>
                  )}

                  {aluno.pessoa?.data_nascimento && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Data de Nascimento</p>
                        <p className="font-medium">
                          {new Date(aluno.pessoa.data_nascimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}

                  {aluno.pessoa?.cpf && (
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">CPF</p>
                        <p className="font-medium">{aluno.pessoa.cpf}</p>
                      </div>
                    </div>
                  )}
                </div>

                {aluno.pessoa?.endereco && (
                  <div className="flex items-start space-x-3 pt-2 border-t border-gray-100">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Endereço</p>
                      <p className="font-medium">{aluno.pessoa.endereco}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações Acadêmicas */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <GraduationCap className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Informações Acadêmicas</CardTitle>
                    <CardDescription>Dados do curso e desempenho acadêmico</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Curso</p>
                      <p className="font-medium">
                        {aluno.curso?.nome || 'Curso não informado'}
                      </p>
                      {aluno.curso?.grau && (
                        <p className="text-sm text-gray-500">{aluno.curso.grau}</p>
                      )}
                    </div>
                  </div>

                  {aluno.periodo && (
                    <div className="flex items-center space-x-3">
                      <Layers3 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Período</p>
                        <p className="font-medium">
                          {aluno.periodo.nome || `Período ${aluno.periodo.numero}`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Ano de Ingresso</p>
                      <p className="font-medium">{aluno.anoIngresso}</p>
                    </div>
                  </div>

                  {aluno.coeficienteAcad && (
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Coeficiente Acadêmico</p>
                        <p className="font-medium text-lg">
                          {parseFloat(aluno.coeficienteAcad?.toString() || '0').toFixed(1)}
                          <span className="text-sm text-gray-500 ml-1">/ 10.0</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {aluno.igreja && (
                    <div className="flex items-center space-x-3">
                      <School className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Igreja de Origem</p>
                        <p className="font-medium">{aluno.igreja}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Histórico Acadêmico */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Histórico Acadêmico</CardTitle>
                    <CardDescription>Disciplinas cursadas e em andamento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Histórico acadêmico detalhado será implementado em breve
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Incluirá notas, frequência e status das disciplinas
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com Resumo */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Acadêmico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getSituacaoColor(aluno.situacao)}`}>
                    {aluno.situacao}
                  </span>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">RA:</span>
                    <span className="font-medium">{aluno.ra}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Matrícula:</span>
                    <span className="font-medium">
                      {new Date(aluno.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {aluno.coeficienteAcad && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">CRA:</span>
                      <span className="font-medium flex items-center">
                        <Award className="h-4 w-4 text-yellow-500 mr-1" />
                        {parseFloat(aluno.coeficienteAcad?.toString() || '0').toFixed(1)}
                      </span>
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
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Disciplinas
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Histórico de Notas
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Horários de Aula
                </Button>
                <Link to={`/alunos`}>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Voltar à Lista
                  </Button>
                </Link>
                {canEdit && (
                  <Link to={`/alunos/edit/${aluno.ra}`}>
                    <Button className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Dados
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo Acadêmico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-gray-600">
                    {new Date().getFullYear() - aluno.anoIngresso}
                  </div>
                  <p className="text-sm text-gray-500">Anos no curso</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-700">-</div>
                    <p className="text-xs text-gray-500">Disciplinas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-700">-</div>
                    <p className="text-xs text-gray-500">Créditos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}