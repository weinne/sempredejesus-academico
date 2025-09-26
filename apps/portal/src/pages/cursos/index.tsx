import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Curso, CreateCurso, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import CrudHeader from '@/components/crud/crud-header';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen,
  GraduationCap,
  Users,
  Clock,
  Award,
  Eye,
  Wand2,
  BarChart3
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const cursoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(80),
  grau: z.string().max(30),
});

type CursoFormData = z.infer<typeof cursoSchema>;

export default function CursosPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [page, setPage] = useState(1);

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
  });

  // Fetch cursos
  const {
    data: cursosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cursos', page, searchTerm],
    queryFn: () => apiService.getCursos({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'nome',
      sortOrder: 'asc'
    }),
    retry: false,
  });

  const cursos = cursosResponse?.data || [];
  const pagination = cursosResponse?.pagination;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (curso: CreateCurso) => apiService.createCurso(curso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({
        title: 'Curso criado',
        description: 'Curso criado com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar curso',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCurso> }) =>
      apiService.updateCurso(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({
        title: 'Curso atualizado',
        description: 'Curso atualizado com sucesso!',
      });
      setShowForm(false);
      setEditingCurso(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar curso',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteCurso(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({
        title: 'Curso removido',
        description: 'Curso removido com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover curso',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter cursos by search term
  const filteredCursos = cursos.filter((curso) =>
    curso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curso.grau.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: CursoFormData) => {
    if (editingCurso) {
      updateMutation.mutate({ id: editingCurso.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setShowForm(true);
    reset({
      nome: curso.nome,
      grau: curso.grau,
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este curso? Esta ação pode afetar alunos e disciplinas vinculadas.')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle new curso
  const handleNew = () => {
    setEditingCurso(null);
    setShowForm(true);
    reset();
  };

  const getGrauColor = (grau: string) => {
    switch (grau.toUpperCase()) {
      case 'BACHARELADO': return 'bg-blue-100 text-blue-800';
      case 'LICENCIATURA': return 'bg-green-100 text-green-800';
      case 'ESPECIALIZACAO': return 'bg-purple-100 text-purple-800';
      case 'MESTRADO': return 'bg-orange-100 text-orange-800';
      case 'DOUTORADO': return 'bg-red-100 text-red-800';
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

  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'));
  useEffect(() => {
    const onResize = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title="Gerenciar Cursos"
        description="Administração dos cursos oferecidos pelo seminário"
        backTo="/dashboard"
        actions={canEdit ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/cursos/wizard')}>
              <Wand2 className="h-4 w-4 mr-2" />
              Wizard de configuracao
            </Button>
            <Button onClick={() => navigate('/cursos/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </div>
        ) : undefined}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <CrudToolbar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Busque por nome ou grau do curso..."
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Cursos Oferecidos ({filteredCursos.length})
              </CardTitle>
              <CardDescription>
                Lista de todos os cursos oferecidos pelo seminário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={filteredCursos}
                viewMode={viewMode}
                isLoading={isLoading}
                columns={[
                  { key: 'nome', header: 'Nome' },
                  { key: 'grau', header: 'Grau', render: (c: any) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGrauColor(c.grau)}`}>{c.grau}</span>
                  ) },
                  { key: 'actions', header: 'Ações', render: (c: any) => (
                    <div className="flex items-center gap-1">
                      <Link to={`/cursos/view/${c.id}`} title="Ver">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/cursos/wizard?cursoId=${c.id}`)}
                            title="Continuar no wizard"
                          >
                            <Wand2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/cursos/edit/${c.id}`)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)} disabled={deleteMutation.isPending} title="Remover">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ) },
                ]}
                cardRender={(curso: any) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 leading-tight">{curso.nome}</h3>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/cursos/wizard?cursoId=${curso.id}`)}
                              title="Continuar no wizard"
                            >
                              <Wand2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/cursos/edit/${curso.id}`)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(curso.id)} disabled={deleteMutation.isPending} title="Remover">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGrauColor(curso.grau)}`}>{curso.grau}</span>
                        </div>
                        {curso.cargaHorariaTotal !== undefined && curso.cargaHorariaTotal > 0 && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{curso.cargaHorariaTotal}h de carga horária total</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-100">
                          <Link to={`/cursos/view/${curso.id}`}>
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
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'}</p>
                  </div>
                }
              />

              <Pagination
                page={page}
                totalPages={pagination?.totalPages || 0}
                onChange={setPage}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

