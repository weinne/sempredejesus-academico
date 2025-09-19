import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Disciplina, Curso, Role } from '@/types/api';
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
  Clock,
  Award,
  FileText,
  Hash,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const disciplinaSchema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  codigo: z.string().min(1, 'Código é obrigatório').max(10),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  creditos: z.number().min(1).max(32767),
  cargaHoraria: z.number().min(1),
  ementa: z.string().optional(),
  bibliografia: z.string().optional(),
  ativo: z.boolean().default(true),
});

type DisciplinaFormData = z.infer<typeof disciplinaSchema>;

export default function DisciplinasPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
  const [page, setPage] = useState(1);

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DisciplinaFormData>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: {
      ativo: true,
    }
  });

  // Fetch cursos for the dropdown
  const {
    data: cursosResponse,
  } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos({ limit: 100 }),
  });

  const cursos = cursosResponse?.data || [];

  // Fetch disciplinas
  const {
    data: disciplinasResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['disciplinas', page, searchTerm],
    queryFn: () => apiService.getDisciplinas({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'nome',
      sortOrder: 'asc'
    }),
    retry: false,
  });

  const disciplinas = disciplinasResponse?.data || [];
  const pagination = disciplinasResponse?.pagination;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (disciplina: Omit<Disciplina, 'id'>) => apiService.createDisciplina(disciplina),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({
        title: 'Disciplina criada',
        description: 'Disciplina criada com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar disciplina',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Disciplina, 'id'>> }) =>
      apiService.updateDisciplina(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({
        title: 'Disciplina atualizada',
        description: 'Disciplina atualizada com sucesso!',
      });
      setShowForm(false);
      setEditingDisciplina(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar disciplina',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteDisciplina(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast({
        title: 'Disciplina removida',
        description: 'Disciplina removida com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover disciplina',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter disciplinas by search term
  const filteredDisciplinas = disciplinas.filter((disciplina) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (disciplina.nome || '').toLowerCase().includes(searchLower) ||
      (disciplina.codigo || '').toLowerCase().includes(searchLower) ||
      (disciplina.ementa || '').toLowerCase().includes(searchLower)
    );
  });

  // Handle form submission
  const onSubmit = (data: DisciplinaFormData) => {
    if (editingDisciplina) {
      updateMutation.mutate({ id: editingDisciplina.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (disciplina: Disciplina) => {
    setEditingDisciplina(disciplina);
    setShowForm(true);
    reset({
      cursoId: disciplina.cursoId,
      codigo: disciplina.codigo || '',
      nome: disciplina.nome,
      creditos: disciplina.creditos,
      cargaHoraria: disciplina.cargaHoraria,
      ementa: disciplina.ementa || '',
      bibliografia: disciplina.bibliografia || '',
      ativo: disciplina.ativo,
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta disciplina?')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle new disciplina
  const handleNew = () => {
    setEditingDisciplina(null);
    setShowForm(true);
    reset({
      ativo: true,
    });
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
        title="Gerenciar Disciplinas"
        description="Administração das disciplinas e planos de ensino"
        backTo="/dashboard"
        actions={canEdit ? (
          <Button onClick={() => navigate('/disciplinas/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Disciplina
          </Button>
        ) : undefined}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <CrudToolbar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Busque por nome, código ou ementa..."
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Disciplinas Cadastradas ({filteredDisciplinas.length})
              </CardTitle>
              <CardDescription>
                Lista de todas as disciplinas e planos de ensino do seminário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={filteredDisciplinas}
                viewMode={viewMode}
                isLoading={isLoading}
                columns={[
                  { key: 'nome', header: 'Nome' },
                  { key: 'codigo', header: 'Código' },
                  { key: 'creditos', header: 'Créditos' },
                  { key: 'cargaHoraria', header: 'Horas' },
                  { key: 'ativo', header: 'Status', render: (d: any) => (
                    <span className={`text-sm font-medium ${d.ativo ? 'text-green-600' : 'text-red-600'}`}>{d.ativo ? 'Ativa' : 'Inativa'}</span>
                  ) },
                  { key: 'actions', header: 'Ações', render: (d: any) => (
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(d)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(d.id)} disabled={deleteMutation.isPending} title="Remover">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ) },
                ]}
                cardRender={(disciplina: any) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${disciplina.ativo ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <BookOpen className={`h-5 w-5 ${disciplina.ativo ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 leading-tight">{disciplina.nome}</h3>
                            {disciplina.codigo && (
                              <p className="text-sm text-gray-500">{disciplina.codigo}</p>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(disciplina)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(disciplina.id)} disabled={deleteMutation.isPending} title="Remover">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4" />
                            <span>{disciplina.creditos} créditos</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{disciplina.cargaHoraria}h</span>
                          </div>
                        </div>
                        {disciplina.ementa && (
                          <div className="flex items-start space-x-2">
                            <FileText className="h-4 w-4 mt-0.5" />
                            <div>
                              <p className="font-medium">Ementa:</p>
                              <p className="line-clamp-3">{disciplina.ementa}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                emptyState={
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{searchTerm ? 'Nenhuma disciplina encontrada' : 'Nenhuma disciplina cadastrada'}</p>
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