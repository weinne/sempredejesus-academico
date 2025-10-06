import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { useCan } from '@/lib/permissions';
import { apiService } from '@/services/api';
import { Aluno, Curso, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import CrudHeader from '@/components/crud/crud-header';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard, StatsGrid } from '@/components/ui/stats-card';
import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Award,
  Eye,
  Layers3,
  ArrowRight,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
export default function AlunosPage() {
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [cursoFiltro, setCursoFiltro] = useState<number | ''>('');
  const [situacaoFiltro, setSituacaoFiltro] = useState<'' | 'ATIVO' | 'TRANCADO' | 'CONCLUIDO' | 'CANCELADO'>('');

  const canCreate = useCan('create', 'alunos');
  const canEdit = useCan('edit', 'alunos');
  const canDelete = useCan('delete', 'alunos');

  // Fetch cursos for the dropdown
  const {
    data: cursosResponse,
  } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 100 }),
  });

  const cursos = cursosResponse?.data || [];

  // Fetch alunos
  const {
    data: alunosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['alunos', page, searchTerm],
    queryFn: () => apiService.getAlunos({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'ra',
      sortOrder: 'asc'
    }),
    retry: false,
  });

  const alunos = alunosResponse?.data || [];
  const pagination = alunosResponse?.pagination;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (ra: string) => apiService.deleteAluno(ra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast({
        title: 'Aluno removido',
        description: 'Aluno removido com sucesso!',
      });
    },
    onError: (error: any) => {
      // Verificar se é erro de restrição de FK
      if (error.response?.status === 409 || 
          error.message?.includes('foreign key') || 
          error.message?.includes('constraint') ||
          error.message?.includes('violates foreign key')) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este aluno possui inscrições em turmas ou avaliações relacionadas. Remova primeiro os dados relacionados para poder excluir o aluno.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Erro ao remover aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const isProfessor = hasRole(Role.PROFESSOR);

  // Restrict visibility for professor to only alunos of his turmas (if API embeds this relation via turmaInscritos/alunoId, fallback to simple filter by cursos not available)
  const visibleAlunos = isProfessor
    ? alunos.filter((a) => (a as any).turmasDoProfessor?.some?.((tp: any) => tp.professorPessoaId === user?.pessoaId)) || []
    : alunos;

  // Filter alunos by search term + selects
  const filteredAlunos = visibleAlunos
    .filter((aluno) => !cursoFiltro || aluno.cursoId === Number(cursoFiltro))
    .filter((aluno) => !situacaoFiltro || aluno.situacao === situacaoFiltro)
    .filter((aluno) => {
      const term = searchTerm.toLowerCase();
      return (
        (aluno.ra || '').includes(searchTerm) ||
        (aluno.pessoa?.nome || '').toLowerCase().includes(term) ||
        (aluno.pessoa?.email || '').toLowerCase().includes(term) ||
        (aluno.situacao || '').toLowerCase().includes(term) ||
        (aluno.curso?.nome || '').toLowerCase().includes(term) ||
        (aluno.periodo?.nome || '').toLowerCase().includes(term) ||
        String(aluno.periodo?.numero || '').includes(searchTerm)
      );
    });

  // Handle delete
  const handleDelete = (ra: string) => {
    if (window.confirm('Tem certeza que deseja remover este aluno?')) {
      deleteMutation.mutate(ra);
    }
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'TRANCADO': return 'bg-yellow-100 text-yellow-800';
      case 'CONCLUIDO': return 'bg-blue-100 text-blue-800';
      case 'CANCELADO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar dados</h2>
              <p className="text-gray-600">Não foi possível conectar com o servidor.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title="Gerenciar Alunos"
        description="Cadastro e gestão de alunos"
        backTo="/dashboard"
        actions={canCreate ? (
          <Button onClick={() => navigate('/alunos/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Matrícula
          </Button>
        ) : undefined}
      />

      {/* Hero Section */}
      <HeroSection
        badge="Gestão Acadêmica"
        title="Gestão completa dos alunos"
        description="Visualize e gerencie todos os alunos matriculados com suas informações acadêmicas, situação e histórico."
        stats={[
          { value: alunos.length, label: 'Total de Alunos' },
          { value: alunos.filter(a => a.situacao === 'ATIVO').length, label: 'Ativos' },
          { value: cursos.length, label: 'Cursos' },
          { value: alunos.filter(a => a.situacao === 'CONCLUIDO').length, label: 'Concluídos' }
        ]}
        actionLink={{
          href: '/cursos',
          label: 'Ver cursos'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Filtros */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">Filtros e Busca</h2>
                <p className="text-sm text-slate-500">Encontre alunos por curso, situação ou informações pessoais</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Curso</label>
                  <select
                    className="border rounded-md px-3 py-2 w-64 text-sm"
                    value={typeof cursoFiltro === 'number' ? String(cursoFiltro) : ''}
                    onChange={(e) => setCursoFiltro(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">Todos os cursos</option>
                    {cursos.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Situação</label>
                  <select
                    className="border rounded-md px-3 py-2 w-48 text-sm"
                    value={situacaoFiltro}
                    onChange={(e) => setSituacaoFiltro((e.target.value || '') as any)}
                  >
                    <option value="">Todas</option>
                    <option value="ATIVO">ATIVO</option>
                    <option value="TRANCADO">TRANCADO</option>
                    <option value="CONCLUIDO">CONCLUIDO</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Buscar</label>
                  <Input
                    placeholder="RA, nome, email ou curso"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-72"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={() => { setCursoFiltro(''); setSituacaoFiltro(''); setSearchTerm(''); setPage(1); }}>
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <StatsGrid>
            <StatCard
              title="Total de Alunos"
              value={alunos.length}
              icon={Users}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Alunos Ativos"
              value={alunos.filter(a => a.situacao === 'ATIVO').length}
              icon={CheckCircle}
              iconColor="text-green-600"
            />
            <StatCard
              title="Concluídos"
              value={alunos.filter(a => a.situacao === 'CONCLUIDO').length}
              icon={Award}
              iconColor="text-purple-600"
            />
            <StatCard
              title="Trancados"
              value={alunos.filter(a => a.situacao === 'TRANCADO').length}
              icon={Clock}
              iconColor="text-yellow-600"
            />
          </StatsGrid>

          {/* Alunos List */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                      Alunos Matriculados
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      {filteredAlunos.length} aluno{filteredAlunos.length !== 1 ? 's' : ''} encontrado{filteredAlunos.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                {canCreate && (
                  <Button onClick={() => navigate('/alunos/new')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Aluno
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredAlunos.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno matriculado'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAlunos.map((aluno) => (
                    <Card key={aluno.ra} className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
                      <CardContent className="p-6">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-slate-800">
                                {aluno.pessoa?.nome || 'Nome não informado'}
                              </h3>
                              <p className="text-sm text-slate-500">RA: {aluno.ra}</p>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Link to={`/alunos/${aluno.ra}`}>
                                <Button variant="ghost" size="sm" title="Visualizar" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link to={`/alunos/edit/${aluno.ra}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Editar"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(aluno.ra)}
                                  disabled={deleteMutation.isPending}
                                  title="Remover"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Informações do Aluno */}
                        <div className="space-y-3">
                          {/* Status e Curso */}
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSituacaoColor(aluno.situacao)}`}>
                              {aluno.situacao}
                            </span>
                            {aluno.coeficienteAcad && (
                              <div className="flex items-center space-x-1">
                                <Award className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  {parseFloat(aluno.coeficienteAcad?.toString() || '0').toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Curso */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <BookOpen className="h-4 w-4" />
                            <span className="truncate">
                              {aluno.curso?.nome || 'Curso não informado'}
                            </span>
                          </div>

                          {/* Período */}
                          {aluno.periodo && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Layers3 className="h-4 w-4" />
                              <span className="truncate">
                                {aluno.periodo.nome || `Período ${aluno.periodo.numero}`}
                              </span>
                            </div>
                          )}

                          {/* Contato */}
                          {aluno.pessoa?.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{aluno.pessoa.email}</span>
                            </div>
                          )}

                          {aluno.pessoa?.telefone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{aluno.pessoa.telefone}</span>
                            </div>
                          )}

                          {/* Ano de Ingresso */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Ingresso: {aluno.anoIngresso}</span>
                          </div>

                          {/* Igreja */}
                          {aluno.igreja && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{aluno.igreja}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

    </div>
  );
}
