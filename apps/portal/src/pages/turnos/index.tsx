import React, { useEffect, useState } from 'react';
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
import { Turno, CreateTurno, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { usePageHero } from '@/hooks/use-page-hero';
import { StatCard, StatsGrid } from '@/components/ui/stats-card';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  Eye,
  Users,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const turnoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(30),
});

type TurnoFormData = z.infer<typeof turnoSchema>;

export default function TurnosPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null);
  const [page, setPage] = useState(1);
  const [deletingTurno, setDeletingTurno] = useState<Turno | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canCreate = useCan('create', 'turnos');
  const canEdit = useCan('edit', 'turnos');
  const canDelete = useCan('delete', 'turnos');

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TurnoFormData>({
    resolver: zodResolver(turnoSchema),
  });

  // Fetch turnos
  const {
    data: turnosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['turnos'],
    queryFn: () => apiService.getTurnos(),
    retry: false,
  });

  const turnos = turnosResponse || [];

  // Configure Hero via hook
  usePageHero({
    title: "Gestão dos turnos acadêmicos",
    description: "Configure e gerencie os turnos oferecidos pelo seminário para organizar a estrutura acadêmica.",
    backTo: "/dashboard",
    stats: [
      { value: turnos.length, label: 'Total de Turnos' },
      { value: turnos.filter(t => t.nome.includes('Manhã')).length, label: 'Manhã' },
      { value: turnos.filter(t => t.nome.includes('Tarde')).length, label: 'Tarde' },
      { value: turnos.filter(t => t.nome.includes('Noite')).length, label: 'Noite' }
    ],
    actionLink: {
      href: '/cursos',
      label: 'Ver cursos'
    },
    actions: canCreate ? (
      <Button onClick={() => navigate('/turnos/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Turno
      </Button>
    ) : undefined
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (turno: CreateTurno) => apiService.createTurno(turno),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      toast({
        title: 'Turno criado',
        description: 'Turno criado com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar turno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTurno> }) =>
      apiService.updateTurno(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      toast({
        title: 'Turno atualizado',
        description: 'Turno atualizado com sucesso!',
      });
      setShowForm(false);
      setEditingTurno(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar turno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteTurno(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      toast({
        title: 'Turno removido',
        description: 'Turno removido com sucesso!',
      });
      setIsDeleteDialogOpen(false);
      setDeletingTurno(null);
    },
    onError: (error: any) => {
      // Verificar se é erro de restrição de FK
      if (error.response?.status === 409 || 
          error.message?.includes('foreign key') || 
          error.message?.includes('constraint') ||
          error.message?.includes('violates foreign key')) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este turno possui currículos ou períodos relacionados. Remova primeiro os dados relacionados para poder excluir o turno.',
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setDeletingTurno(null);
        return;
      }
      
      toast({
        title: 'Erro ao remover turno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      setDeletingTurno(null);
    },
  });

  // Filter turnos by search term
  const filteredTurnos = turnos.filter((turno) =>
    turno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: TurnoFormData) => {
    if (editingTurno) {
      updateMutation.mutate({ id: editingTurno.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (turno: Turno) => {
    setEditingTurno(turno);
    setShowForm(true);
    reset({
      nome: turno.nome,
    });
  };

  // Handle delete
  const handleDelete = (turno: Turno) => {
    setDeletingTurno(turno);
    setIsDeleteDialogOpen(true);
  };

  // Handle new turno
  const handleNew = () => {
    setEditingTurno(null);
    setShowForm(true);
    reset();
  };

  const getTurnoColor = (nome: string) => {
    switch (nome.toUpperCase()) {
      case 'DIURNO': return 'bg-yellow-100 text-yellow-800';
      case 'VESPERTINO': return 'bg-orange-100 text-orange-800';
      case 'NOTURNO': return 'bg-blue-100 text-blue-800';
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

  // Automaticamente usar cards em telas menores para evitar barra de rolagem lateral
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'card' : 'table'
  );

  useEffect(() => {
    const onResize = () => {
      // Em telas menores que 1024px, usar cards automaticamente
      if (window.innerWidth < 1024) {
        setViewMode('card');
      } else {
        // Só permitir tabela em telas grandes (>= 1024px)
        setViewMode('table');
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Filtros */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">Filtros e Busca</h2>
                <p className="text-sm text-slate-500">Encontre turnos por nome ou período</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Buscar</label>
                  <Input
                    placeholder="Busque por nome do turno..."
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
              title="Total de Turnos"
              value={turnos.length}
              icon={Clock}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Manhã"
              value={turnos.filter(t => t.nome.includes('Manhã')).length}
              icon={TrendingUp}
              iconColor="text-yellow-600"
            />
            <StatCard
              title="Tarde"
              value={turnos.filter(t => t.nome.includes('Tarde')).length}
              icon={CheckCircle}
              iconColor="text-orange-600"
            />
            <StatCard
              title="Noite"
              value={turnos.filter(t => t.nome.includes('Noite')).length}
              icon={XCircle}
              iconColor="text-purple-600"
            />
          </StatsGrid>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Turnos Oferecidos ({filteredTurnos.length})
              </CardTitle>
              <CardDescription>
                Lista de todos os turnos disponíveis no seminário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={filteredTurnos}
                viewMode={viewMode}
                isLoading={isLoading}
                columns={[
                  { key: 'nome', header: 'Nome', render: (t: any) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTurnoColor(t.nome)}`}>{t.nome}</span>
                  ) },
                  { key: 'actions', header: 'Ações', render: (t: any) => (
                    <div className="flex items-center gap-1">
                      <Link to={`/turnos/view/${t.id}`} title="Ver">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/turnos/edit/${t.id}`)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(t)} disabled={deleteMutation.isPending} title="Remover">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ) },
                ]}
                cardRender={(turno: any) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 leading-tight">{turno.nome}</h3>
                            <p className="text-sm text-gray-500">Turno acadêmico</p>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/turnos/edit/${turno.id}`)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(turno.id)} disabled={deleteMutation.isPending} title="Remover">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTurnoColor(turno.nome)}`}>{turno.nome}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                          <Link to={`/turnos/view/${turno.id}`}>
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
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{searchTerm ? 'Nenhum turno encontrado' : 'Nenhum turno cadastrado'}</p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingTurno(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o turno <strong>{deletingTurno?.nome}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
              <br />
              <br />
              <span className="text-sm text-gray-600">
                Esta ação pode afetar currículos e períodos vinculados.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingTurno(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTurno && deleteMutation.mutate(deletingTurno.id)}
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
