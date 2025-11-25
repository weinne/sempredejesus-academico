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
import { Professor, CreateProfessorWithUser, Pessoa, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { usePageHero } from '@/hooks/use-page-hero';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import { 
  Plus, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  AlertTriangle
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const professorSchema = z.object({
  matricula: z.string().length(8, 'Matrícula deve ter 8 caracteres'),
  pessoaId: z.number().min(1, 'Selecione uma pessoa').optional(),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  formacaoAcad: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'INATIVO']),
  createUser: z.boolean().default(true),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
});

const updateProfessorSchema = professorSchema.partial().omit({ matricula: true, createUser: true, username: true, password: true });

type ProfessorFormData = z.infer<typeof professorSchema>;
type UpdateProfessorFormData = z.infer<typeof updateProfessorSchema>;

export default function ProfessoresPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFiltro, setSituacaoFiltro] = useState<'' | 'ATIVO' | 'INATIVO'>('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [page, setPage] = useState(1);
  const [createNewPessoa, setCreateNewPessoa] = useState(true);
  const [pessoaNome, setPessoaNome] = useState('');
  const [pessoaSexo, setPessoaSexo] = useState('');
  const [pessoaEmail, setPessoaEmail] = useState('');
  const [pessoaCpf, setPessoaCpf] = useState('');
  const [pessoaTelefone, setPessoaTelefone] = useState('');
  const [pessoaDataNasc, setPessoaDataNasc] = useState('');
  const [pessoaEndereco, setPessoaEndereco] = useState('');
  const [deletingProfessor, setDeletingProfessor] = useState<Professor | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canCreate = useCan('create', 'professores');
  const canEdit = useCan('edit', 'professores');
  const canDelete = useCan('delete', 'professores');

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      situacao: 'ATIVO',
      dataInicio: new Date().toISOString().split('T')[0],
      createUser: true,
    }
  });

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    formState: { errors: errorsUpdate },
  } = useForm<UpdateProfessorFormData>({
    resolver: zodResolver(updateProfessorSchema),
  });

  const createUser = watch('createUser');

  // Fetch pessoas for the dropdown
  const {
    data: pessoas = [],
  } = useQuery({
    queryKey: ['pessoas'],
    queryFn: apiService.getPessoas,
  });

  // Fetch professores
  const {
    data: professoresResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['professores', page, searchTerm],
    queryFn: () => apiService.getProfessores({ 
      page, 
      limit: 20, 
      search: searchTerm,
      sortBy: 'matricula',
      sortOrder: 'asc'
    }),
    retry: false,
  });

  const professores = professoresResponse?.data || [];
  const pagination = professoresResponse?.pagination;

  // Configure Hero via hook
  usePageHero({
    title: "Gestão completa dos professores",
    description: "Visualize e gerencie todos os professores com suas informações acadêmicas, situação e histórico.",
    backTo: "/dashboard",
    stats: [
      { value: pagination?.total || 0, label: 'Total de Professores' },
      { value: professores.filter(p => p.situacao === 'ATIVO').length, label: 'Ativos' },
      { value: professores.filter(p => p.situacao === 'INATIVO').length, label: 'Inativos' },
      { value: professores.filter(p => p.formacaoAcad).length, label: 'Com Formação' }
    ],
    actionLink: {
      href: '/disciplinas',
      label: 'Ver disciplinas'
    },
    actions: canCreate ? (
      <Link to="/professores/new">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Professor
        </Button>
      </Link>
    ) : undefined
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (professor: CreateProfessorWithUser) => apiService.createProfessor(professor),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      toast({
        title: 'Professor cadastrado',
        description: result.user 
          ? `Professor e usuário criados com sucesso! Username: ${result.user.username}`
          : 'Professor cadastrado com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cadastrar professor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ matricula, data }: { matricula: string; data: Partial<CreateProfessorWithUser> }) =>
      apiService.updateProfessor(matricula, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      toast({
        title: 'Professor atualizado',
        description: 'Professor atualizado com sucesso!',
      });
      setShowForm(false);
      setEditingProfessor(null);
      resetUpdate();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar professor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (matricula: string) => apiService.deleteProfessor(matricula),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      toast({
        title: 'Professor removido',
        description: 'Professor removido com sucesso!',
      });
      setIsDeleteDialogOpen(false);
      setDeletingProfessor(null);
    },
    onError: (error: any) => {
      // Verificar se é erro de restrição de FK
      if (error.response?.status === 409 || 
          error.message?.includes('foreign key') || 
          error.message?.includes('constraint') ||
          error.message?.includes('violates foreign key')) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este professor possui turmas relacionadas. Remova primeiro as turmas relacionadas para poder excluir o professor.',
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setDeletingProfessor(null);
        return;
      }
      
      toast({
        title: 'Erro ao remover professor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      setDeletingProfessor(null);
    },
  });

  // Filter professores by search term
  const filteredProfessores = professores
    .filter((p) => !situacaoFiltro || p.situacao === situacaoFiltro)
    .filter((professor) =>
      professor.matricula.includes(searchTerm) ||
      (professor.pessoa?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (professor.pessoa?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.situacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (professor.formacaoAcad || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Handle form submission
  const onSubmit = async (data: ProfessorFormData | UpdateProfessorFormData) => {
    if (editingProfessor) {
      const { createUser, username, password, ...updateData } = data as ProfessorFormData;
      updateMutation.mutate({ matricula: editingProfessor.matricula, data: updateData });
      return;
    }
    try {
      let pessoaIdToUse = (data as ProfessorFormData).pessoaId as number | undefined;
      if (createNewPessoa) {
        const created = await apiService.createPessoa({
          nome: pessoaNome,
          sexo: (pessoaSexo as any) || 'M',
          email: pessoaEmail,
          cpf: pessoaCpf,
          telefone: pessoaTelefone,
          endereco: pessoaEndereco,
          data_nascimento: pessoaDataNasc,
        } as any);
        pessoaIdToUse = Number(created.id);
        queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      }
      await createMutation.mutateAsync({ ...(data as ProfessorFormData), pessoaId: pessoaIdToUse! });
    } catch (error: any) {
      toast({ title: 'Erro ao cadastrar professor', description: error?.message || 'Falha ao cadastrar', variant: 'destructive' });
    }
  };

  // Handle edit
  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setShowForm(true);
    resetUpdate({
      pessoaId: professor.pessoaId,
      dataInicio: professor.dataInicio,
      formacaoAcad: professor.formacaoAcad || '',
      situacao: professor.situacao,
    });
    navigate(`/professores/edit/${professor.matricula}`);
  };

  // Handle delete
  const handleDelete = (professor: Professor) => {
    setDeletingProfessor(professor);
    setIsDeleteDialogOpen(true);
  };

  // Handle new professor
  const handleNew = () => {
    setEditingProfessor(null);
    setShowForm(true);
    reset({
      situacao: 'ATIVO',
      dataInicio: new Date().toISOString().split('T')[0],
      createUser: true,
    });
    setCreateNewPessoa(true);
    setPessoaNome('');
    setPessoaSexo('');
    setPessoaEmail('');
    setPessoaCpf('');
    setPessoaTelefone('');
    setPessoaDataNasc('');
    setPessoaEndereco('');
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'INATIVO': return 'bg-red-100 text-red-800';
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
          <CrudToolbar
            search={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            searchPlaceholder="Buscar por matrícula, nome, email ou formação..."
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
                  value={situacaoFiltro}
                  onChange={(e) => {
                    setSituacaoFiltro((e.target.value || '') as any);
                    setPage(1);
                  }}
                >
                  <option value="">Todas situações</option>
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
                {(situacaoFiltro || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Professores Cadastrados ({filteredProfessores.length})
              </CardTitle>
              <CardDescription>
                Lista de todo o corpo docente cadastrado no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={filteredProfessores}
                viewMode={viewMode}
                isLoading={isLoading}
                columns={[
                  { key: 'matricula', header: 'Matrícula' },
                  { key: 'nome', header: 'Nome', render: (p: any) => p?.pessoa?.nome || 'N/A' },
                  { key: 'email', header: 'Email', render: (p: any) => p?.pessoa?.email || 'N/A' },
                  { key: 'situacao', header: 'Situação', render: (p: any) => (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSituacaoColor(p.situacao)}`}>{p.situacao}</span>
                  ) },
                  { key: 'actions', header: 'Ações', render: (p: any) => (
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(p)} disabled={deleteMutation.isPending} title="Remover">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ) },
                ]}
                cardRender={(professor: any) => (
                  <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
                    <CardContent className="p-4">
                      {/* Header do Card */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base text-slate-800 truncate">
                              {professor.pessoa?.nome || 'Nome não informado'}
                            </h3>
                            <p className="text-xs text-slate-500">Mat: {professor.matricula}</p>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-1 shrink-0 ml-2">
                            <Link to={`/professores/edit/${professor.matricula}`}>
                              <Button variant="ghost" size="sm" title="Editar" className="h-7 w-7 p-0">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(professor)}
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
                            variant={professor.situacao === 'ATIVO' ? 'default' : 'secondary'}
                            className={`text-xs ${
                              professor.situacao === 'ATIVO' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {professor.situacao}
                          </Badge>
                          {professor.formacaoAcad && (
                            <Badge variant="outline" className="text-xs">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {professor.formacaoAcad.length > 25 
                                ? `${professor.formacaoAcad.substring(0, 25)}...` 
                                : professor.formacaoAcad}
                            </Badge>
                          )}
                        </div>

                        {/* Informações adicionais em linha */}
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Início: {new Date(professor.dataInicio).toLocaleDateString('pt-BR')}
                          </span>
                          {professor.pessoa?.email && (
                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{professor.pessoa.email}</span>
                            </span>
                          )}
                          {professor.pessoa?.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {professor.pessoa.telefone}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                emptyState={
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{searchTerm ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado'}</p>
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

      {/* Dialog para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingProfessor(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o professor <strong>{deletingProfessor?.pessoa?.nome || deletingProfessor?.matricula}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingProfessor(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProfessor && deleteMutation.mutate(deletingProfessor.matricula)}
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