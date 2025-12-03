import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/providers/auth-provider';
import { useCan } from '@/lib/permissions';
import { apiService } from '@/services/api';
import { Aluno, Curso, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { usePageHero } from '@/hooks/use-page-hero';
import CrudToolbar from '@/components/crud/crud-toolbar';
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
  AlertTriangle
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
  const [deletingAluno, setDeletingAluno] = useState<Aluno | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'card' : 'table'
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode('card');
      } else {
        setViewMode('table');
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  // Configure Hero via hook
  usePageHero({
    title: "Gestão completa dos alunos",
    description: "Visualize e gerencie todos os alunos matriculados com suas informações acadêmicas, situação e histórico.",
    backTo: "/dashboard",
    stats: [
      { value: pagination?.total || 0, label: 'Total de Alunos' },
      { value: alunos.filter(a => a.situacao === 'ATIVO').length, label: 'Ativos' },
      { value: cursos.length, label: 'Cursos' },
      { value: alunos.filter(a => a.situacao === 'CONCLUIDO').length, label: 'Concluídos' }
    ],
    actionLink: {
      href: '/cursos',
      label: 'Ver cursos'
    },
    actions: canCreate ? (
      <Button onClick={() => navigate('/alunos/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Matrícula
      </Button>
    ) : undefined
  });

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
        setIsDeleteDialogOpen(false);
        setDeletingAluno(null);
        return;
      }
      
      toast({
        title: 'Erro ao remover aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      setDeletingAluno(null);
    },
  });

  const isProfessor = hasRole(Role.PROFESSOR);

  // Restrict visibility for professor to only alunos of his turmas (if API embeds this relation via turmaInscritos/alunoId, fallback to simple filter by cursos not available)
  const visibleAlunos = isProfessor
    ? alunos.filter((a) => (a as any).turmasDoProfessor?.some?.((tp: any) => tp.professorPessoaId === user?.pessoaId)) || []
    : alunos;

  // Filter alunos by search term + selects
  const getAlunoNome = (aluno: Aluno) => (aluno.pessoa?.nome?.trim()
    || aluno.pessoa?.nomeCompleto?.trim()
    || '').trim();

  const filteredAlunos = visibleAlunos
    .filter((aluno) => !cursoFiltro || aluno.cursoId === Number(cursoFiltro))
    .filter((aluno) => !situacaoFiltro || aluno.situacao === situacaoFiltro)
    .filter((aluno) => {
      const term = searchTerm.toLowerCase();
      const pessoaNome = getAlunoNome(aluno).toLowerCase();
      return (
        (aluno.ra || '').includes(searchTerm) ||
        pessoaNome.includes(term) ||
        (aluno.pessoa?.email || '').toLowerCase().includes(term) ||
        (aluno.situacao || '').toLowerCase().includes(term) ||
        (aluno.curso?.nome || '').toLowerCase().includes(term) ||
        (aluno.periodo?.nome || '').toLowerCase().includes(term) ||
        String(aluno.periodo?.numero || '').includes(searchTerm)
      );
    });

  // Handle delete
  const handleDelete = (aluno: Aluno) => {
    setDeletingAluno(aluno);
    setIsDeleteDialogOpen(true);
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          <CrudToolbar
            search={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            searchPlaceholder="Buscar por RA, nome, email ou curso..."
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              if (window.innerWidth >= 1024) {
                setViewMode(mode);
              }
            }}
            filtersSlot={
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="border rounded-md px-2.5 py-1.5 text-xs sm:text-sm h-9"
                  value={typeof cursoFiltro === 'number' ? String(cursoFiltro) : ''}
                  onChange={(e) => {
                    setCursoFiltro(e.target.value ? Number(e.target.value) : '');
                    setPage(1);
                  }}
                >
                  <option value="">Todos os cursos</option>
                  {cursos.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <select
                  className="border rounded-md px-2.5 py-1.5 text-xs sm:text-sm h-9"
                  value={situacaoFiltro}
                  onChange={(e) => {
                    setSituacaoFiltro((e.target.value || '') as any);
                    setPage(1);
                  }}
                >
                  <option value="">Todas situações</option>
                  <option value="ATIVO">ATIVO</option>
                  <option value="TRANCADO">TRANCADO</option>
                  <option value="CONCLUIDO">CONCLUIDO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
                {(cursoFiltro || situacaoFiltro || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCursoFiltro('');
                      setSituacaoFiltro('');
                      setSearchTerm('');
                      setPage(1);
                    }}
                    className="h-9 text-xs sm:text-sm"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            }
          />

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
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredAlunos.map((aluno) => (
                    <Card key={aluno.ra} className="hover:shadow-md transition-shadow border-0 shadow-sm">
                      <CardContent className="p-4">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                              <GraduationCap className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-base text-slate-800 truncate">
                                {getAlunoNome(aluno) || 'Nome não informado'}
                              </h3>
                              <p className="text-xs text-slate-500">RA: {aluno.ra}</p>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1 shrink-0 ml-2">
                              <Link to={`/alunos/${aluno.ra}`}>
                                <Button variant="ghost" size="sm" title="Visualizar" className="h-7 w-7 p-0">
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              <Link to={`/alunos/edit/${aluno.ra}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Editar"
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(aluno)}
                                  disabled={deleteMutation.isPending}
                                  title="Remover"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Badges e Informações Compactas */}
                        <div className="space-y-2">
                          {/* Badges principais */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <Badge 
                              variant={aluno.situacao === 'ATIVO' ? 'default' : 'secondary'}
                              className={`text-xs ${
                                aluno.situacao === 'ATIVO' ? 'bg-green-100 text-green-800 border-green-200' :
                                aluno.situacao === 'TRANCADO' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                aluno.situacao === 'CONCLUIDO' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                'bg-red-100 text-red-800 border-red-200'
                              }`}
                            >
                              {aluno.situacao}
                            </Badge>
                            {aluno.curso?.nome && (
                              <Badge variant="outline" className="text-xs">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {aluno.curso.nome.length > 20 ? `${aluno.curso.nome.substring(0, 20)}...` : aluno.curso.nome}
                              </Badge>
                            )}
                            {aluno.periodo && (
                              <Badge variant="outline" className="text-xs">
                                <Layers3 className="h-3 w-3 mr-1" />
                                {aluno.periodo.nome || `P${aluno.periodo.numero}`}
                              </Badge>
                            )}
                            {aluno.coeficienteAcad && (
                              <Badge variant="outline" className="text-xs">
                                <Award className="h-3 w-3 mr-1" />
                                CR: {parseFloat(aluno.coeficienteAcad.toString()).toFixed(1)}
                              </Badge>
                            )}
                          </div>

                          {/* Informações adicionais em linha */}
                          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {aluno.anoIngresso}
                            </span>
                            {aluno.pessoa?.email && (
                              <span className="flex items-center gap-1 truncate max-w-[140px]">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{aluno.pessoa.email}</span>
                              </span>
                            )}
                            {aluno.pessoa?.telefone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {aluno.pessoa.telefone}
                              </span>
                            )}
                          </div>

                          {/* Igreja se houver */}
                          {aluno.igreja && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin className="h-3 w-3" />
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

      {/* Dialog para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingAluno(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
            Tem certeza que deseja excluir o aluno <strong>{deletingAluno ? (getAlunoNome(deletingAluno) || deletingAluno.ra) : ''}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingAluno(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAluno && deleteMutation.mutate(deletingAluno.ra)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
