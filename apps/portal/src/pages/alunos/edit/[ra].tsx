import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Aluno, CreateAlunoWithUser, Pessoa, Curso, Role, Periodo, Turno, Coorte } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import PessoaFormModal from '@/components/modals/pessoa-form-modal';
import { 
  ArrowLeft, 
  Save, 
  X,
  User,
  GraduationCap,
  Plus,
  Eye
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

type AddressState = {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

const createEmptyAddress = (): AddressState => ({
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
});

const parseEndereco = (raw?: unknown): AddressState => {
  const base = createEmptyAddress();
  if (!raw) return base;

  const normalize = (value: unknown): Partial<AddressState> | null => {
    if (!value) return null;
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Partial<AddressState>;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const attempts = [trimmed, trimmed.replace(/'/g, '"')];
      for (const candidate of attempts) {
        try {
          const parsed = JSON.parse(candidate);
          const normalized = normalize(parsed);
          if (normalized) return normalized;
        } catch {
          // ignore invalid JSON
        }
      }
    }
    return null;
  };

  const normalized = normalize(raw);
  if (normalized) {
    return { ...base, ...normalized };
  }

  if (typeof raw === 'string') {
    return { ...base, logradouro: raw };
  }

  return base;
};

const serializeEndereco = (address: AddressState) => JSON.stringify(address);

const formatDateForInput = (value?: string | null) => {
  if (!value) return '';
  if (value.includes('T')) return value.split('T')[0];
  return value;
};

const updateAlunoSchema = z.object({
  pessoaId: z.number().min(1, 'Selecione uma pessoa'),
  cursoId: z.number().min(1, 'Selecione um curso'),
  turnoId: z.number().optional(),
  coorteId: z.number().optional(),
  periodoId: z.number().min(1, 'Selecione um período'),
  anoIngresso: z.number().min(1900).max(2100),
  igreja: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO']),
  coeficienteAcad: z.number().min(0).max(10).optional(),
});

type UpdateAlunoFormData = z.infer<typeof updateAlunoSchema>;

export default function EditAlunoPage() {
  const { ra } = useParams<{ ra: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPessoaModal, setShowPessoaModal] = useState(false);

  const [endereco, setEndereco] = useState<AddressState>(createEmptyAddress());

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Redirect if user doesn't have permission
  if (!canEdit) {
    navigate('/alunos');
    return null;
  }

  // Fetch aluno data
  const {
    data: aluno,
    isLoading: isLoadingAluno,
    error: alunoError,
  } = useQuery({
    queryKey: ['aluno', ra],
    queryFn: () => apiService.getAluno(ra!),
    enabled: !!ra,
    retry: false,
  });

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

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateAlunoFormData>({
    resolver: zodResolver(updateAlunoSchema),
  });

  const selectedCursoId = watch('cursoId');
  const previousCursoIdRef = React.useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previousCursoIdRef.current === selectedCursoId) {
      return;
    }
    if (!selectedCursoId) {
      setValue('periodoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
    } else if (aluno && selectedCursoId === aluno.cursoId) {
      setValue('periodoId', aluno.periodoId, { shouldDirty: false, shouldValidate: false });
    } else {
      setValue('periodoId', undefined as unknown as number, { shouldDirty: false, shouldValidate: false });
    }
    previousCursoIdRef.current = selectedCursoId;
  }, [aluno, selectedCursoId, setValue]);

  const cursos = cursosResponse?.data || [];
  const { data: turnos = [] } = useQuery({ queryKey: ['turnos'], queryFn: apiService.getTurnos });
  const { data: coortes = [] } = useQuery({ queryKey: ['coortes'], queryFn: apiService.getCoortes });
  const { data: periodosResponse } = useQuery({
    queryKey: ['periodos', selectedCursoId],
    queryFn: () => apiService.getPeriodos({ cursoId: selectedCursoId!, limit: 100 }),
    enabled: !!selectedCursoId,
  });
  const periodos = periodosResponse?.data || [];

  // Masks and normalization helpers for Pessoa fields
  const onlyDigits = (value: string) => value.replace(/\D/g, '');
  const maskCPF = (digits: string) => digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
  const maskPhone = (digits: string) => {
    const d = digits.slice(0, 11);
    if (d.length <= 10) {
      return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  // User related: find user by pessoaId of aluno
  const { data: usersList } = useQuery({ queryKey: ['users'], queryFn: () => apiService.getUsers({ limit: 100 }) });
  const relatedUser = usersList?.data?.find((u: any) => Number(u.pessoaId) === Number(aluno?.pessoaId));

  const updateUserMutation = useMutation({
    mutationFn: (payload: any) => apiService.updateUser(Number(relatedUser!.id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Usuário atualizado', description: 'Dados de usuário atualizados com sucesso!' });
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar usuário', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  // Initialize form with aluno data
  React.useEffect(() => {
    if (aluno) {
      reset({
        pessoaId: aluno.pessoaId,
        cursoId: aluno.cursoId,
        turnoId: aluno.turnoId || undefined,
        coorteId: aluno.coorteId || undefined,
        periodoId: aluno.periodoId,
        anoIngresso: aluno.anoIngresso,
        igreja: aluno.igreja || '',
        situacao: aluno.situacao,
        coeficienteAcad: parseFloat(aluno.coeficienteAcad?.toString() || '0') || undefined,
      });
    }
  }, [aluno, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateAlunoWithUser>) =>
      apiService.updateAluno(ra!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aluno', ra] });
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast({
        title: 'Aluno atualizado',
        description: 'Os dados do aluno foram atualizados com sucesso!',
      });
      navigate(`/alunos/${ra}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar aluno',
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

  // Inline pessoa editing (update pessoa of current aluno)
  const updatePessoaMutation = useMutation({
    mutationFn: (payload: any) => apiService.updatePessoa(String(aluno!.pessoa!.id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aluno', ra] });
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({ title: 'Pessoa atualizada', description: 'Dados pessoais atualizados com sucesso!' });
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar pessoa', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  useEffect(() => {
    if (aluno?.pessoa) {
      setEndereco(parseEndereco(aluno.pessoa.endereco));
    } else {
      setEndereco(createEmptyAddress());
    }
  }, [aluno]);

  const handleEnderecoFieldChange = (field: keyof AddressState) => (value: string) => {
    setEndereco(prev => {
      const next = { ...prev, [field]: value };
      if (aluno?.pessoa?.id) {
        updatePessoaMutation.mutate({ endereco: serializeEndereco(next) });
      }
      return next;
    });
  };

  // Handle form submission
  const onSubmit = (data: UpdateAlunoFormData) => {
    updateMutation.mutate(data);
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('Deseja sair sem salvar as alterações?')) {
        navigate(`/alunos/${ra}`);
      }
    } else {
      navigate(`/alunos/${ra}`);
    }
  };

  if (isLoadingAluno) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (alunoError || !aluno) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 py-4">
              <Link to="/alunos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Alunos
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Aluno</h1>
                <p className="text-sm text-gray-600">RA: {ra}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Aluno não encontrado</h2>
              <p className="text-gray-600">Não foi possível carregar os dados do aluno com RA {ra}.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Breadcrumb */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/alunos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Alunos
                </Button>
              </Link>
              <div>
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <Link to="/alunos" className="hover:text-gray-700">Alunos</Link>
                  <span>/</span>
                  <Link to={`/alunos/${ra}`} className="hover:text-gray-700">{aluno.pessoa?.nome}</Link>
                  <span>/</span>
                  <span className="text-gray-900">Editar</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">Editar Aluno</h1>
                <p className="text-sm text-gray-600">RA: {aluno.ra}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link to={`/alunos/${ra}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Editar Dados do Aluno</CardTitle>
                  <CardDescription>
                    Atualize as informações acadêmicas e pessoais do aluno
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados Básicos */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Matrícula</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RA
                      </label>
                      <Input
                        value={aluno.ra}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">O RA não pode ser alterado</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pessoa *
                      </label>
                      <div className="flex space-x-2">
                        <select
                          {...register('pessoaId', { valueAsNumber: true })}
                          className={`flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.pessoaId ? 'border-red-500' : ''}`}
                        >
                          <option value="">Selecione uma pessoa...</option>
                          {pessoas.map((pessoa) => (
                            <option key={pessoa.id} value={pessoa.id}>
                              {pessoa.nome} {pessoa.email ? `(${pessoa.email})` : ''}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPessoaModal(true)}
                          className="px-3"
                          title="Cadastrar nova pessoa"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {errors.pessoaId && (
                        <p className="mt-1 text-sm text-red-600">{errors.pessoaId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Curso *
                      </label>
                      <select
                        {...register('cursoId', { valueAsNumber: true })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.cursoId ? 'border-red-500' : ''}`}
                      >
                        <option value="">Selecione um curso...</option>
                        {cursos.map((curso) => (
                          <option key={curso.id} value={curso.id}>
                            {curso.nome} ({curso.grau})
                          </option>
                        ))}
                      </select>
                      {errors.cursoId && (
                        <p className="mt-1 text-sm text-red-600">{errors.cursoId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Período *
                      </label>
                      <select
                        {...register('periodoId', { valueAsNumber: true })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.periodoId ? 'border-red-500' : ''}`}
                        disabled={!selectedCursoId}
                      >
                        <option value="">{selectedCursoId ? 'Selecione um período...' : 'Selecione um curso primeiro'}</option>
                        {periodos.map((periodo: Periodo) => (
                          <option key={periodo.id} value={periodo.id}>
                            {periodo.nome || `Período ${periodo.numero}`}
                          </option>
                        ))}
                      </select>
                      {errors.periodoId && (
                        <p className="mt-1 text-sm text-red-600">{errors.periodoId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Turno
                      </label>
                      <select
                        {...register('turnoId', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione um turno...</option>
                        {turnos.map((t: Turno) => (
                          <option key={t.id} value={t.id}>{t.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coorte (turma de ingresso)
                      </label>
                      <select
                        {...register('coorteId', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione uma coorte...</option>
                        {coortes.map((c: Coorte) => (
                          <option key={c.id} value={c.id}>{c.rotulo}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ano de Ingresso *
                      </label>
                      <Input
                        type="number"
                        min="1900"
                        max="2100"
                        {...register('anoIngresso', { valueAsNumber: true })}
                        className={errors.anoIngresso ? 'border-red-500' : ''}
                      />
                      {errors.anoIngresso && (
                        <p className="mt-1 text-sm text-red-600">{errors.anoIngresso.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação *
                      </label>
                      <select
                        {...register('situacao')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ATIVO">Ativo</option>
                        <option value="TRANCADO">Trancado</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coeficiente Acadêmico
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        {...register('coeficienteAcad', { valueAsNumber: true })}
                        placeholder="Ex: 8.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Dados de Pessoa (Inline) */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                      <Input
                        defaultValue={aluno.pessoa?.nome || ''}
                        onChange={(e) => updatePessoaMutation.mutate({ nome: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                      <select
                        defaultValue={aluno.pessoa?.sexo || ''}
                        onChange={(e) => updatePessoaMutation.mutate({ sexo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="O">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        type="email"
                        defaultValue={aluno.pessoa?.email || ''}
                        onChange={(e) => updatePessoaMutation.mutate({ email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                      <Input
                        defaultValue={aluno.pessoa?.cpf || ''}
                      onChange={(e) => {
                        const digits = onlyDigits(e.target.value || '');
                        e.target.value = maskCPF(digits);
                        updatePessoaMutation.mutate({ cpf: digits });
                      }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                      <Input
                        defaultValue={aluno.pessoa?.telefone || ''}
                      onChange={(e) => {
                        const digits = onlyDigits(e.target.value || '');
                        e.target.value = maskPhone(digits);
                        updatePessoaMutation.mutate({ telefone: digits });
                      }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                      <Input
                        type="date"
                        defaultValue={formatDateForInput(aluno.pessoa?.data_nascimento)}
                        onChange={(e) => updatePessoaMutation.mutate({ data_nascimento: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <Input value={endereco.logradouro} onChange={(e) => handleEnderecoFieldChange('logradouro')(e.target.value)} placeholder="Logradouro" className="md:col-span-3" />
                        <Input value={endereco.numero} onChange={(e) => handleEnderecoFieldChange('numero')(e.target.value)} placeholder="Número" className="md:col-span-1" />
                        <Input value={endereco.complemento} onChange={(e) => handleEnderecoFieldChange('complemento')(e.target.value)} placeholder="Complemento" className="md:col-span-2" />
                        <Input value={endereco.bairro} onChange={(e) => handleEnderecoFieldChange('bairro')(e.target.value)} placeholder="Bairro" className="md:col-span-2" />
                        <Input value={endereco.cidade} onChange={(e) => handleEnderecoFieldChange('cidade')(e.target.value)} placeholder="Cidade" className="md:col-span-2" />
                        <Input value={endereco.estado} onChange={(e) => { const value = e.target.value.toUpperCase().slice(0, 2); handleEnderecoFieldChange('estado')(value); }} placeholder="UF" className="md:col-span-1" maxLength={2} />
                        <Input value={endereco.cep} onChange={(e) => handleEnderecoFieldChange('cep')(onlyDigits(e.target.value || ''))} placeholder="CEP" className="md:col-span-1" />
                      </div>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Dados Complementares */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Complementares</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Igreja de Origem
                      </label>
                      <Input
                        {...register('igreja')}
                        placeholder="Nome da igreja"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending || !isDirty}
                    className="min-w-[120px]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {relatedUser && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Dados de Usuário</CardTitle>
                <CardDescription>Atualize as informações de acesso do usuário vinculado</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget as HTMLFormElement);
                    const payload: any = {
                      username: String(fd.get('user.username') || relatedUser.username),
                      role: String(fd.get('user.role') || relatedUser.role) as Role,
                      isActive: String(fd.get('user.isActive') || relatedUser.isActive) as 'S' | 'N',
                    };
                    updateUserMutation.mutate(payload);
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <Input name="user.username" defaultValue={relatedUser.username} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
                    <select name="user.role" defaultValue={relatedUser.role} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value={Role.ADMIN}>Administrador</option>
                      <option value={Role.SECRETARIA}>Secretaria</option>
                      <option value={Role.PROFESSOR}>Professor</option>
                      <option value={Role.ALUNO}>Aluno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ativo</label>
                    <select name="user.isActive" defaultValue={relatedUser.isActive} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value="S">Sim</option>
                      <option value="N">Não</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button type="submit" disabled={updateUserMutation.isPending}>Atualizar Usuário</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          {relatedUser && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Dados de Usuário</CardTitle>
                    <CardDescription>Atualize as informações de acesso do usuário vinculado</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget as HTMLFormElement);
                    const payload: any = {
                      username: String(fd.get('user.username') || relatedUser.username),
                      role: String(fd.get('user.role') || relatedUser.role) as Role,
                      isActive: String(fd.get('user.isActive') || relatedUser.isActive) as 'S' | 'N',
                    };
                    updateUserMutation.mutate(payload);
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <Input name="user.username" defaultValue={relatedUser.username} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
                    <select name="user.role" defaultValue={relatedUser.role} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value={Role.ADMIN}>Administrador</option>
                      <option value={Role.SECRETARIA}>Secretaria</option>
                      <option value={Role.PROFESSOR}>Professor</option>
                      <option value={Role.ALUNO}>Aluno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ativo</label>
                    <select name="user.isActive" defaultValue={relatedUser.isActive} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value="S">Sim</option>
                      <option value="N">Não</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button type="submit" disabled={updateUserMutation.isPending}>Atualizar Usuário</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
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
