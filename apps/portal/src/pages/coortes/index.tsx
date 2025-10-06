import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { useCan } from '@/lib/permissions';
import { apiService } from '@/services/api';
import { Coorte, CreateCoorte, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import CrudHeader from '@/components/crud/crud-header';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard, StatsGrid } from '@/components/ui/stats-card';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Eye,
  GraduationCap,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';

export default function CoortesPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const canCreate = useCan('create', 'coortes');
  const canEdit = useCan('edit', 'coortes');
  const canDelete = useCan('delete', 'coortes');

  // Fetch coortes
  const {
    data: coortesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['coortes'],
    queryFn: () => apiService.getCoortes(),
    retry: false,
  });

  const coortes = coortesResponse || [];

  // Fetch cursos for reference
  const { data: cursosResponse } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
  });
  const cursos = cursosResponse?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteCoorte(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coortes'] });
      toast({
        title: 'Coorte removida',
        description: 'Coorte removida com sucesso!',
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
          description: 'Esta coorte possui alunos relacionados. Remova primeiro os alunos relacionados para poder excluir a coorte.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Erro ao remover coorte',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter coortes by search term
  const filteredCoortes = coortes.filter((coorte) =>
    coorte.rotulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coorte.curso?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(coorte.anoIngresso).includes(searchTerm)
  );

  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta coorte? Esta ação pode afetar alunos vinculados.')) {
      deleteMutation.mutate(id);
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

  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'));
  useEffect(() => {
    const onResize = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title="Gerenciar Coortes"
        description="Administração das turmas de ingresso dos alunos"
        backTo="/dashboard"
        actions={canCreate ? (
          <Button onClick={() => navigate('/coortes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Coorte
          </Button>
        ) : undefined}
      />

      {/* Hero Section */}
      <HeroSection
        badge="Estrutura Acadêmica"
        title="Gestão das coortes acadêmicas"
        description="Configure e gerencie as turmas de ingresso dos alunos para organizar a estrutura acadêmica."
        stats={[
          { value: coortes.length, label: 'Total de Coortes' },
          { value: coortes.filter(c => c.ativo).length, label: 'Ativas' },
          { value: cursos.length, label: 'Cursos' },
          { value: coortes.length, label: 'Coortes' }
        ]}
        actionLink={{
          href: '/alunos',
          label: 'Ver alunos'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Filtros */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">Filtros e Busca</h2>
                <p className="text-sm text-slate-500">Encontre coortes por rótulo, curso ou ano de ingresso</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Buscar</label>
                  <Input
                    placeholder="Busque por rótulo, curso ou ano..."
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
              title="Total de Coortes"
              value={coortes.length}
              icon={Users}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Coortes Ativas"
              value={coortes.filter(c => c.ativo).length}
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
              title="Coortes"
              value={coortes.length}
              icon={Clock}
              iconColor="text-orange-600"
            />
          </StatsGrid>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Coortes Acadêmicas ({filteredCoortes.length})
              </CardTitle>
              <CardDescription>
                Lista de todas as coortes (turmas de ingresso) do seminário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={filteredCoortes}
                viewMode={viewMode}
                isLoading={isLoading}
                columns={[
                  {
                    key: 'rotulo',
                    header: 'Rótulo',
                    render: (c: any) => (
                      <span className={`font-medium ${c.ativo ? 'text-blue-700' : 'text-gray-500'}`}>
                        {c.rotulo}
                      </span>
                    ),
                  },
                  {
                    key: 'curso',
                    header: 'Curso',
                    render: (c: any) => c.curso?.nome || '—',
                  },
                  {
                    key: 'anoIngresso',
                    header: 'Ano de Ingresso',
                    render: (c: any) => c.anoIngresso,
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
                      <Link to={`/coortes/view/${c.id}`} title="Ver">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/coortes/edit/${c.id}`)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)} disabled={deleteMutation.isPending} title="Remover">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ) },
                ]}
                cardRender={(coorte: any) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <GraduationCap className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className={`font-semibold text-lg ${coorte.ativo ? 'text-gray-900' : 'text-gray-500'}`}>
                              {coorte.rotulo}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {coorte.curso?.nome} • Ingresso: {coorte.anoIngresso}
                            </p>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/coortes/edit/${coorte.id}`)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(coorte.id)} disabled={deleteMutation.isPending} title="Remover">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          {coorte.ativo ? (
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
                        <div className="pt-2 border-t border-gray-100">
                          <Link to={`/coortes/view/${coorte.id}`}>
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
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{searchTerm ? 'Nenhuma coorte encontrada' : 'Nenhuma coorte cadastrada'}</p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
