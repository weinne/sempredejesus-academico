import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Aluno, CreateAlunoWithUser, Pessoa, Curso, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import PessoaFormModal from '@/components/modals/pessoa-form-modal';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  BookOpen,
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const alunoSchema = z.object({
  ra: z.string().max(8).optional(),
  pessoaId: z.number().min(1, 'Selecione uma pessoa'),
  cursoId: z.number().min(1, 'Selecione um curso'),
  anoIngresso: z.number().min(1900).max(2100),
  igreja: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO']),
  coeficienteAcad: z.number().min(0).max(10).optional(),
  createUser: z.boolean().default(false),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
});

const updateAlunoSchema = alunoSchema.partial().omit({ ra: true, createUser: true, username: true, password: true });

type AlunoFormData = z.infer<typeof alunoSchema>;
type UpdateAlunoFormData = z.infer<typeof updateAlunoSchema>;

export default function AlunosPage() {
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPessoaModal, setShowPessoaModal] = useState(false);
  const [page, setPage] = useState(1);

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      situacao: 'ATIVO',
      anoIngresso: new Date().getFullYear(),
      createUser: false,
    }
  });

  const createUser = watch('createUser');

  // Fetch pessoas for the dropdown
  const {
    data: pessoas = [],
  } = useQuery({
    queryKey: ['pessoas'],
    queryFn: apiService.getPessoas,
  });

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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (aluno: CreateAlunoWithUser) => apiService.createAluno(aluno),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast({
        title: 'Aluno criado',
        description: result.user 
          ? `Aluno e usuário criados com sucesso! Username: ${result.user.username}`
          : 'Aluno criado com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
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
      toast({
        title: 'Erro ao remover aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Create pessoa mutation
  const createPessoaMutation = useMutation({
    mutationFn: (pessoa: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>) => apiService.createPessoa(pessoa),
    onSuccess: (newPessoa) => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({
        title: 'Pessoa criada',
        description: 'Pessoa criada com sucesso!',
      });
      setShowPessoaModal(false);
      
      // Auto-select the new pessoa
      setValue('pessoaId', Number(newPessoa.id));
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar pessoa',
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

  // Filter alunos by search term
  const filteredAlunos = visibleAlunos.filter((aluno) =>
    (aluno.ra || '').includes(searchTerm) ||
    (aluno.pessoa?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aluno.pessoa?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aluno.situacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aluno.curso?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission for creating
  const onSubmitCreate = (data: AlunoFormData) => {
    createMutation.mutate(data);
  };

  // Handle delete
  const handleDelete = (ra: string) => {
    if (window.confirm('Tem certeza que deseja remover este aluno?')) {
      deleteMutation.mutate(ra);
    }
  };

  // Handle new aluno
  const handleNew = () => {
    setShowForm(true);
    reset({
      situacao: 'ATIVO',
      anoIngresso: new Date().getFullYear(),
      createUser: false,
    });
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" aria-label="Voltar" title="Voltar">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Alunos</h1>
              </div>
            </div>
            {canEdit && (
              <Button onClick={() => navigate('/alunos/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Matrícula
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Buscar Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Busque por RA, nome, email, situação ou curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Form removido: agora em /alunos/new */}

          {/* Alunos List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Alunos Matriculados ({filteredAlunos.length})
              </CardTitle>
              <CardDescription>
                Lista de todos os alunos matriculados no sistema
              </CardDescription>
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
                    <Card key={aluno.ra} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <GraduationCap className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>                            <h3 className="font-semibold text-lg text-gray-900">
                              {aluno.pessoa?.nome || 'Nome não informado'}
                            </h3>
                              <p className="text-sm text-gray-500">RA: {aluno.ra}</p>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Link to={`/alunos/${aluno.ra}`}>
                                <Button variant="ghost" size="sm" title="Visualizar">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link to={`/alunos/edit/${aluno.ra}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(aluno.ra)}
                                disabled={deleteMutation.isPending}
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

      {/* Modal para cadastrar nova pessoa */}
      <PessoaFormModal
        isOpen={showPessoaModal}
        onClose={() => setShowPessoaModal(false)}
        onSubmit={(data) => createPessoaMutation.mutate(data)}
        isLoading={createPessoaMutation.isPending}
      />
    </div>
  );
}