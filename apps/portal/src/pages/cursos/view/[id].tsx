import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { Curso, Role, Periodo, Disciplina, Curriculo, Turno } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard } from '@/components/ui/stats-card';
import {
  ArrowLeft,
  BookOpen,
  Edit,
  Calendar,
  Layers3,
  Clock,
  Award,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  GraduationCap,
  FileText
} from 'lucide-react';

function formatGrauBadge(grau: string) {
  switch (grau?.toUpperCase()) {
    case 'BACHARELADO':
      return 'bg-blue-500/10 text-blue-600';
    case 'LICENCIATURA':
      return 'bg-emerald-500/10 text-emerald-600';
    case 'ESPECIALIZACAO':
      return 'bg-purple-500/10 text-purple-600';
    case 'MESTRADO':
      return 'bg-orange-500/10 text-orange-600';
    case 'DOUTORADO':
      return 'bg-rose-500/10 text-rose-600';
    default:
      return 'bg-slate-500/10 text-slate-600';
  }
}

export default function CursoViewPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();

  const {
    data: curso,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['curso', id],
    queryFn: () => apiService.getCurso(Number(id)),
    enabled: !!id,
    retry: false,
  });

  // Buscar períodos do curso
  const { data: periodosResponse } = useQuery({
    queryKey: ['periodos', 'curso', id],
    queryFn: () => apiService.getPeriodos({ cursoId: Number(id), limit: 100 }),
    enabled: !!id,
  });
  const periodos = periodosResponse?.data || [];

  // Buscar disciplinas do curso
  const { data: disciplinasResponse } = useQuery({
    queryKey: ['disciplinas', 'curso', id],
    queryFn: () => apiService.getDisciplinas({ cursoId: Number(id), limit: 100 }),
    enabled: !!id,
  });
  const disciplinas = disciplinasResponse?.data || [];

  // Buscar currículos do curso
  const { data: curriculos = [] } = useQuery({
    queryKey: ['curriculos', 'curso', id],
    queryFn: () => apiService.getCurriculos({ cursoId: Number(id) }),
    enabled: !!id,
  });

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Curso não encontrado</h2>
              <p className="text-slate-600 mb-4">O curso solicitado não foi encontrado ou não existe.</p>
              <Link to="/cursos">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar aos Cursos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/cursos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Cursos
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Badge className={formatGrauBadge(curso.grau)}>{curso.grau}</Badge>
                <h1 className="text-2xl font-bold text-gray-900">{curso.nome}</h1>
              </div>
              <p className="text-sm text-gray-600">Detalhes completos do curso</p>
            </div>
            {canEdit && (
              <Link to={`/cursos/edit/${curso.id}`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Curso
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        badge="Detalhes do Curso"
        title={curso.nome}
        description={`Curso de ${curso.grau} com estrutura completa de períodos e disciplinas.`}
        stats={[
          { value: periodos.length, label: 'Períodos' },
          { value: disciplinas.length, label: 'Disciplinas' },
          { value: curriculos.length, label: 'Currículos' },
          { value: curso.grau, label: 'Grau' }
        ]}
        actionLink={{
          href: '/cursos',
          label: 'Ver todos os cursos'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Períodos"
              value={periodos.length}
              icon={Calendar}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Disciplinas"
              value={disciplinas.length}
              icon={BookOpen}
              iconColor="text-green-600"
            />
            <StatCard
              title="Currículos"
              value={curriculos.length}
              icon={FileText}
              iconColor="text-purple-600"
            />
            <StatCard
              title="Grau"
              value={curso.grau}
              icon={GraduationCap}
              iconColor="text-orange-600"
            />
          </div>

          {/* Informações do Curso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Informações do Curso
              </CardTitle>
              <CardDescription>Detalhes básicos do curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Nome</label>
                  <p className="text-lg font-semibold text-slate-900">{curso.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Grau</label>
                  <div className="mt-1">
                    <Badge className={formatGrauBadge(curso.grau)}>{curso.grau}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Períodos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Períodos ({periodos.length})
              </CardTitle>
              <CardDescription>Períodos acadêmicos do curso</CardDescription>
            </CardHeader>
            <CardContent>
              {periodos.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {periodos.map((periodo) => (
                    <Card key={periodo.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">{periodo.nome}</h3>
                          <Badge variant="outline">Período {periodo.numero}</Badge>
                        </div>
                        {periodo.descricao && (
                          <p className="text-sm text-slate-600 mb-3">{periodo.descricao}</p>
                        )}
                        <div className="flex items-center text-sm text-slate-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {periodo.dataInicio && periodo.dataFim ? (
                            <span>
                              {new Date(periodo.dataInicio).toLocaleDateString()} - {new Date(periodo.dataFim).toLocaleDateString()}
                            </span>
                          ) : (
                            <span>Datas não definidas</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Nenhum período cadastrado para este curso.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disciplinas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Disciplinas ({disciplinas.length})
              </CardTitle>
              <CardDescription>Disciplinas oferecidas no curso</CardDescription>
            </CardHeader>
            <CardContent>
              {disciplinas.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {disciplinas.map((disciplina) => (
                    <Card key={disciplina.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900">{disciplina.nome}</h3>
                            <p className="text-sm text-slate-600">{disciplina.codigo}</p>
                          </div>
                          <Badge variant="outline">{disciplina.creditos} créditos</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {disciplina.cargaHoraria}h
                          </div>
                          {disciplina.ementa && (
                            <p className="text-xs text-slate-500 line-clamp-2">{disciplina.ementa}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Nenhuma disciplina cadastrada para este curso.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Currículos */}
          {curriculos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Currículos ({curriculos.length})
                </CardTitle>
                <CardDescription>Versões de currículo do curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {curriculos.map((curriculo) => (
                    <Card key={curriculo.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">Versão {curriculo.versao}</h3>
                          <Badge variant={curriculo.ativo ? "default" : "secondary"}>
                            {curriculo.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                          {curriculo.vigenteDe && (
                            <div>Vigente de: {new Date(curriculo.vigenteDe).toLocaleDateString()}</div>
                          )}
                          {curriculo.vigenteAte && (
                            <div>Vigente até: {new Date(curriculo.vigenteAte).toLocaleDateString()}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}