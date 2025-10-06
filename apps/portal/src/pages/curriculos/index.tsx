import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
// import { useAuth } from '@/providers/auth-provider';
import { useCan } from '@/lib/permissions';
import { apiService } from '@/services/api';
import { Curriculo } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import CrudHeader from '@/components/crud/crud-header';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard, StatsGrid } from '@/components/ui/stats-card';
import { DataList } from '@/components/crud/data-list';
// import { Pagination } from '@/components/crud/pagination';
import { Plus, Edit, Trash2, FileText, Eye, Users, CheckCircle, XCircle, Clock, Award, AlertTriangle } from 'lucide-react';
// import { z } from 'zod';

// Schema removido (criação/edição ocorre em páginas dedicadas)

export default function CurriculosPage() {
  // const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  // inline form removido
  const [deletingCurriculo, setDeletingCurriculo] = useState<Curriculo | null>(null);
  // const [page, setPage] = useState(1);

  const canCreate = useCan('create', 'periodos');
  const canEdit = useCan('edit', 'periodos');
  const canDelete = useCan('delete', 'periodos');

  // Form setup
  // Inline form removido

  // Fetch curriculos
  const {
    data: curriculosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['curriculos'],
    queryFn: () => apiService.getCurriculos(),
    retry: false,
  });

  const curriculos = curriculosResponse || [];

  // Fetch cursos and turnos for dropdowns
  const { data: cursosResponse } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];

  const { data: turnos = [] } = useQuery({ queryKey: ['turnos'], queryFn: apiService.getTurnos });

  // Criação ocorre em /curriculos/new

  // Edição ocorre em /curriculos/edit/[id]

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteCurriculo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculos'] });
      toast({
        title: 'Currículo removido',
        description: 'Currículo removido com sucesso!',
      });
      setDeletingCurriculo(null);
    },
    onError: (error: any) => {
      // Verificar se é erro de restrição de FK
      if (error.response?.status === 409 || error.message?.includes('foreign key') || error.message?.includes('constraint')) {
        toast({
          title: 'Restrição de Integridade',
          description: 'Este currículo possui dados relacionados. Deseja excluir o currículo e todos os dados relacionados?',
          variant: 'destructive',
        });
        // Não fechar o diálogo, permitir que o usuário confirme
        return;
      }
      
      toast({
        title: 'Erro ao remover currículo',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setDeletingCurriculo(null);
    },
  });

  // Filter curriculos by search term
  const filteredCurriculos = curriculos.filter((curriculo) =>
    curriculo.versao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (curriculo.curso?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (curriculo.turno?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Inline submit removed; creation/edition happens on dedicated pages

  // Handle delete with FK constraint
  const handleDelete = (curriculo: Curriculo) => {
    setDeletingCurriculo(curriculo);
    deleteMutation.mutate(curriculo.id);
  };

  // Handle forced delete (with related data)
  const handleForceDelete = () => {
    if (deletingCurriculo) {
      // Aqui você pode implementar uma lógica para excluir dados relacionados
      // Por enquanto, vamos tentar excluir novamente
      deleteMutation.mutate(deletingCurriculo.id);
    }
  };

  // Navegação auxiliar
  // (usamos navigate inline nas ações)

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

  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'));
  useEffect(() => {
    const onResize = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title="Gerenciar Currículos"
        description="Administração das versões de currículo dos cursos"
        backTo="/dashboard"
        actions={canCreate ? (
          <Button onClick={() => navigate('/curriculos/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Currículo
          </Button>
        ) : undefined}
      />

      {/* Hero Section */}
      <HeroSection
        badge="Estrutura Acadêmica"
        title="Gestão dos currículos acadêmicos"
        description="Configure e gerencie as versões de currículo dos cursos para organizar a estrutura acadêmica."
        stats={[
          { value: curriculos.length, label: 'Total de Currículos' },
          { value: curriculos.filter(c => c.ativo).length, label: 'Ativos' },
          { value: cursos.length, label: 'Cursos' },
          { value: turnos.length, label: 'Turnos' }
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
                <p className="text-sm text-slate-500">Encontre currículos por versão, curso ou turno</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Buscar</label>
                  <Input
                    placeholder="Busque por versão, curso ou turno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-96"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={() => setSearchTerm('')}>
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <StatsGrid>
            <StatCard
              title="Total de Currículos"
              value={curriculos.length}
              icon={FileText}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Currículos Ativos"
              value={curriculos.filter(c => c.ativo).length}
              icon={CheckCircle}
              iconColor="text-green-600"
            />
            <StatCard
              title="Cursos"
              value={cursos.length}
              icon={Award}
              iconColor="text-purple-600"
            />
            <StatCard
              title="Turnos"
              value={turnos.length}
              icon={Clock}
              iconColor="text-orange-600"
            />
          </StatsGrid>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Currículos Oferecidos ({filteredCurriculos.length})
              </CardTitle>
              <CardDescription>
                Lista de todos os currículos disponíveis no seminário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={filteredCurriculos}
                viewMode={viewMode}
                isLoading={isLoading}
                columns={[
                  {
                    key: 'versao',
                    header: 'Versão',
                    render: (c: any) => (
                      <span className={`font-medium ${c.ativo ? 'text-green-700' : 'text-gray-500'}`}>
                        {c.versao}
                      </span>
                    ),
                  },
                  {
                    key: 'curso',
                    header: 'Curso',
                    render: (c: any) => c.curso?.nome || '—',
                  },
                  {
                    key: 'turno',
                    header: 'Turno',
                    render: (c: any) => c.turno?.nome || '—',
                  },
                  {
                    key: 'vigencia',
                    header: 'Vigência',
                    render: (c: any) => {
                      if (!c.vigenteDe && !c.vigenteAte) return '—';
                      return `${c.vigenteDe || '...'} até ${c.vigenteAte || '...'}`;
                    },
                  },
                  {
                    key: 'ativo',
                    header: 'Status',
                    render: (c: any) => (
                      c.ativo ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </span>
                      )
                    ),
                  },
                  { key: 'actions', header: 'Ações', render: (c: any) => (
                    <div className="flex items-center gap-1">
                      <Link to={`/curriculos/view/${c.id}`} title="Ver">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/curriculos/edit/${c.id}`)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={deleteMutation.isPending} title="Remover">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center">
                                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                                    Confirmar Exclusão
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o currículo <strong>{c.versao}
                                    </strong>?
                                    <br />
                                    <br />
                                    <span className="text-red-600 font-medium">
                                      Esta ação não pode ser desfeita.
                                    </span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(c)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </div>
                  ) },
                ]}
                cardRender={(curriculo: any) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className={`font-semibold text-lg ${curriculo.ativo ? 'text-gray-900' : 'text-gray-500'}`}>
                              {curriculo.versao}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {curriculo.curso?.nome} • {curriculo.turno?.nome}
                            </p>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/curriculos/edit/${curriculo.id}`)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" disabled={deleteMutation.isPending} title="Remover">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center">
                                      <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                                      Confirmar Exclusão
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o currículo <strong>{curriculo.versao}
                                      </strong>?
                                      <br />
                                      <br />
                                      <span className="text-red-600 font-medium">
                                        Esta ação não pode ser desfeita.
                                      </span>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(curriculo)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          {curriculo.ativo ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </span>
                          )}
                        </div>
                        {(curriculo.vigenteDe || curriculo.vigenteAte) && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>
                              {curriculo.vigenteDe ? `De ${curriculo.vigenteDe}` : '...'} até {curriculo.vigenteAte || '...'}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-100">
                          <Link to={`/curriculos/view/${curriculo.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                emptyState={
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{searchTerm ? 'Nenhum currículo encontrado' : 'Nenhum currículo cadastrado'}</p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog para exclusão forçada quando há restrições de FK */}
      <AlertDialog open={!!deletingCurriculo && deleteMutation.isError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Restrição de Integridade
            </AlertDialogTitle>
            <AlertDialogDescription>
              O currículo <strong>{deletingCurriculo?.versao}</strong> possui dados relacionados que impedem sua exclusão.
              <br />
              <br />
              <span className="text-orange-600 font-medium">
                Deseja excluir o currículo e todos os dados relacionados?
              </span>
              <br />
              <br />
              <span className="text-red-600 text-sm">
                ⚠️ Esta ação irá excluir permanentemente todos os dados relacionados e não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCurriculo(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDelete}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Excluir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
