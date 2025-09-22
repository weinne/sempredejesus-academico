import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Curriculo, CreateCurriculo, Role } from '@/types/api';
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
  FileText,
  Eye,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const curriculoSchema = z.object({
  cursoId: z.number().min(1, 'Selecione um curso'),
  turnoId: z.number().min(1, 'Selecione um turno'),
  versao: z.string().min(1, 'Versão é obrigatória').max(40),
  vigenteDe: z.string().optional(),
  vigenteAte: z.string().optional(),
  ativo: z.boolean().default(true),
});

type CurriculoFormData = z.infer<typeof curriculoSchema>;

export default function CurriculosPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCurriculo, setEditingCurriculo] = useState<Curriculo | null>(null);
  const [page, setPage] = useState(1);

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CurriculoFormData>({
    resolver: zodResolver(curriculoSchema),
  });

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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (curriculo: CreateCurriculo) => apiService.createCurriculo(curriculo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculos'] });
      toast({
        title: 'Currículo criado',
        description: 'Currículo criado com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar currículo',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCurriculo> }) =>
      apiService.updateCurriculo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculos'] });
      toast({
        title: 'Currículo atualizado',
        description: 'Currículo atualizado com sucesso!',
      });
      setShowForm(false);
      setEditingCurriculo(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar currículo',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteCurriculo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculos'] });
      toast({
        title: 'Currículo removido',
        description: 'Currículo removido com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover currículo',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter curriculos by search term
  const filteredCurriculos = curriculos.filter((curriculo) =>
    curriculo.versao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (curriculo.curso?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (curriculo.turno?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: CurriculoFormData) => {
    const payload = {
      ...data,
      vigenteDe: data.vigenteDe || undefined,
      vigenteAte: data.vigenteAte || undefined,
      ativo: data.ativo ?? true,
    };

    if (editingCurriculo) {
      updateMutation.mutate({ id: editingCurriculo.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Handle edit
  const handleEdit = (curriculo: Curriculo) => {
    setEditingCurriculo(curriculo);
    setShowForm(true);
    reset({
      cursoId: curriculo.cursoId,
      turnoId: curriculo.turnoId,
      versao: curriculo.versao,
      vigenteDe: curriculo.vigenteDe || '',
      vigenteAte: curriculo.vigenteAte || '',
      ativo: curriculo.ativo,
    });
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este currículo? Esta ação pode afetar períodos e coortes vinculados.')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle new curriculo
  const handleNew = () => {
    setEditingCurriculo(null);
    setShowForm(true);
    reset();
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
        title="Gerenciar Currículos"
        description="Administração das versões de currículo dos cursos"
        backTo="/dashboard"
        actions={canEdit ? (
          <Button onClick={() => navigate('/curriculos/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Currículo
          </Button>
        ) : undefined}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <CrudToolbar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Busque por versão, curso ou turno..."
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

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
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)} disabled={deleteMutation.isPending} title="Remover">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(curriculo.id)} disabled={deleteMutation.isPending} title="Remover">
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </div>
  );
}
