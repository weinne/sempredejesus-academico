import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Professor, CreateProfessorWithUser, Pessoa, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import CrudHeader from '@/components/crud/crud-header';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard } from '@/components/ui/stats-card';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookOpen,
  Award,
  Briefcase,
  Eye,
  EyeOff,
  List,
  LayoutGrid,
  ArrowRight,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock
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

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

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
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover professor',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
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
  };

  // Handle delete
  const handleDelete = (matricula: string) => {
    if (window.confirm('Tem certeza que deseja remover este professor?')) {
      deleteMutation.mutate(matricula);
    }
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

  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'));
  useEffect(() => {
    const onResize = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title="Gerenciar Professores"
        description="Cadastro e gestão do corpo docente"
        backTo="/dashboard"
        actions={canEdit ? (
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Professor
          </Button>
        ) : undefined}
      />

      {/* Hero Section */}
      <HeroSection
        badge="Corpo Docente"
        title="Gestão completa dos professores"
        description="Visualize e gerencie todos os professores com suas informações acadêmicas, situação e histórico."
        stats={[
          { value: professores.length, label: 'Total de Professores' },
          { value: professores.filter(p => p.situacao === 'ATIVO').length, label: 'Ativos' },
          { value: professores.filter(p => p.situacao === 'INATIVO').length, label: 'Inativos' },
          { value: professores.filter(p => p.formacaoAcad).length, label: 'Com Formação' }
        ]}
        actionLink={{
          href: '/disciplinas',
          label: 'Ver disciplinas'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Filtros */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">Filtros e Busca</h2>
                <p className="text-sm text-slate-500">Encontre professores por situação, nome ou informações acadêmicas</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Situação</label>
                  <select className="border rounded-md px-3 py-2 w-48 text-sm" value={situacaoFiltro} onChange={(e)=>setSituacaoFiltro((e.target.value||'') as any)}>
                    <option value="">Todas</option>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Buscar</label>
                  <Input
                    placeholder="Matrícula, nome, email, situação ou formação"
                    value={searchTerm}
                    onChange={(e)=>setSearchTerm(e.target.value)}
                    className="w-96"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={()=>{ setSituacaoFiltro(''); setSearchTerm(''); setPage(1); }}>
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total de Professores"
              value={professores.length}
              icon={Users}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Professores Ativos"
              value={professores.filter(p => p.situacao === 'ATIVO').length}
              icon={CheckCircle}
              iconColor="text-green-600"
            />
            <StatCard
              title="Inativos"
              value={professores.filter(p => p.situacao === 'INATIVO').length}
              icon={XCircle}
              iconColor="text-red-600"
            />
            <StatCard
              title="Com Formação"
              value={professores.filter(p => p.formacaoAcad).length}
              icon={Award}
              iconColor="text-purple-600"
            />
          </div>

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
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(p.matricula)} disabled={deleteMutation.isPending} title="Remover">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ) },
                ]}
                cardRender={(professor: any) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{professor.pessoa?.nome || 'Nome não informado'}</h3>
                            <p className="text-sm text-gray-500">Mat: {professor.matricula}</p>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(professor)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(professor.matricula)} disabled={deleteMutation.isPending} title="Remover">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 text-sm text-gray-600">
                        {professor.formacaoAcad && (
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4" />
                            <span className="truncate">{professor.formacaoAcad}</span>
                          </div>
                        )}
                        {professor.pessoa?.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{professor.pessoa.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Início: {new Date(professor.dataInicio).toLocaleDateString('pt-BR')}</span>
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
    </div>
  );
}