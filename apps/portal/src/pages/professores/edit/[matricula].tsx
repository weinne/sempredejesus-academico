import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Building2, MapPin, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CrudHeader from '@/components/crud/crud-header';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { apiService } from '@/services/api';
import { Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useFormErrors } from '@/hooks/use-form-errors';
import { onlyDigits, maskCPF, maskPhone } from '@/lib/form-utils';
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

const formatDateForInput = (value?: string | null) => {
  if (!value) return '';
  if (value.includes('T')) return value.split('T')[0];
  return value;
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

const pessoaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  sexo: z.enum(['M', 'F', 'O'], { errorMap: () => ({ message: 'Selecione um sexo válido' }) }).optional(),
  email: z.string().email().optional().or(z.literal('')),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  data_nascimento: z.string().optional(),
});

const formSchema = z.object({
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  situacao: z.enum(['ATIVO', 'INATIVO']),
  formacaoAcad: z.string().max(120, 'Formação deve ter no máximo 120 caracteres').optional(),
  pessoa: pessoaSchema,
});

const createUserSchema = z.object({
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres').max(50),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
});

type EditFormData = z.infer<typeof formSchema>;
type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function ProfessorEditPage() {
  const { matricula } = useParams<{ matricula: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleFormError } = useFormErrors();
  const { handleFormError: handleUserFormError } = useFormErrors();

  const { data: professor, isLoading } = useQuery({
    queryKey: ['professor', matricula],
    queryFn: () => apiService.getProfessor(String(matricula!)),
    enabled: !!matricula,
  });

  const { data: usersResponse } = useQuery({ 
    queryKey: ['users'], 
    queryFn: () => apiService.getUsers({ limit: 100 }) 
  });
  const relatedUser = usersResponse?.data?.find((u: any) => Number(u.pessoaId) === Number(professor?.pessoaId));

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataInicio: '',
      situacao: 'ATIVO',
      formacaoAcad: '',
      pessoa: {
        nome: '',
        sexo: undefined,
        email: '',
        cpf: '',
        telefone: '',
        data_nascimento: '',
      },
    },
  });

  const { register: registerUser, handleSubmit: handleSubmitUser, formState: { errors: errorsUser } } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const [endereco, setEndereco] = useState<AddressState>(createEmptyAddress());

  useEffect(() => {
    if (!professor) {
      setEndereco(createEmptyAddress());
      return;
    }

    reset({
      dataInicio: formatDateForInput(professor.dataInicio),
      situacao: professor.situacao as 'ATIVO' | 'INATIVO',
      formacaoAcad: professor.formacaoAcad || '',
      pessoa: {
        nome: professor.pessoa?.nome || '',
        sexo: (professor.pessoa?.sexo as any) || undefined,
        email: professor.pessoa?.email || '',
        cpf: professor.pessoa?.cpf || '',
        telefone: professor.pessoa?.telefone || '',
        data_nascimento: formatDateForInput(professor.pessoa?.data_nascimento),
      },
    });

    setEndereco(parseEndereco(professor.pessoa?.endereco));
  }, [professor, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiService.updateProfessor(String(matricula!), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      queryClient.invalidateQueries({ queryKey: ['professor', matricula] });
      toast({ title: 'Professor atualizado', description: 'Dados atualizados com sucesso!' });
      navigate('/professores');
    },
    onError: (error: any) => toast({ 
      title: 'Erro ao atualizar professor', 
      description: error.message || 'Erro desconhecido', 
      variant: 'destructive' 
    }),
  });

  const updatePessoaMutation = useMutation({
    mutationFn: (payload: any) => apiService.updatePessoa(String(professor!.pessoa!.id), payload),
    onError: (error: any) => toast({ 
      title: 'Erro ao atualizar pessoa', 
      description: error.message || 'Erro desconhecido', 
      variant: 'destructive' 
    }),
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: any) => apiService.updateUser(Number(relatedUser!.id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Usuário atualizado', description: 'Dados de usuário atualizados com sucesso!' });
    },
    onError: (error: any) => toast({ 
      title: 'Erro ao atualizar usuário', 
      description: error.message || 'Erro desconhecido', 
      variant: 'destructive' 
    }),
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: { username: string; password: string; pessoaId: number; role: Role }) => 
      apiService.createUser(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ 
        title: 'Usuário criado', 
        description: `Usuário criado com sucesso! Username: ${result.username}` 
      });
    },
    onError: (error: any) => toast({ 
      title: 'Erro ao criar usuário', 
      description: error.message || 'Erro desconhecido', 
      variant: 'destructive' 
    }),
  });

  const onSubmit = async (data: EditFormData) => {
    try {
      if (professor?.pessoa?.id) {
        const enderecoPayload = serializeEndereco(endereco);
        await updatePessoaMutation.mutateAsync({
          nome: data.pessoa.nome,
          sexo: data.pessoa.sexo,
          email: data.pessoa.email,
          cpf: data.pessoa.cpf ? onlyDigits(data.pessoa.cpf) : undefined,
          telefone: data.pessoa.telefone ? onlyDigits(data.pessoa.telefone) : undefined,
          endereco: enderecoPayload,
          data_nascimento: data.pessoa.data_nascimento || null,
        });
      }
    } catch {
      return;
    }

    updateMutation.mutate({
      dataInicio: data.dataInicio,
      formacaoAcad: data.formacaoAcad || '',
      situacao: data.situacao,
    });
  };

  const onCreateUser = (data: CreateUserFormData) => {
    if (!professor?.pessoaId) {
      toast({ 
        title: 'Erro', 
        description: 'Professor não possui pessoa vinculada', 
        variant: 'destructive' 
      });
      return;
    }

    createUserMutation.mutate({
      username: data.username,
      password: data.password,
      pessoaId: Number(professor.pessoaId),
      role: Role.PROFESSOR,
    });
  };

  if (isLoading || !professor) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CrudHeader title="Editar Professor" backTo="/professores" />
        <div className="max-w-6xl mx-auto p-6 text-center text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader 
        title={`Editar Professor ${professor.matricula}`} 
        backTo="/professores" 
        description={professor.pessoa?.nome || ''}
      />
      
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Form Principal */}
        <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
          
          {/* Dados Profissionais */}
          <FormSection
            icon={Building2}
            title="Dados Profissionais"
            description="Informações sobre situação funcional"
          >
            <div data-field="dataInicio">
              <label className="block text-sm font-medium text-slate-700 mb-2">Data de Início *</label>
              <Input 
                type="date" 
                {...register('dataInicio')} 
                className={`${errors.dataInicio ? 'border-red-500' : ''} h-11`} 
              />
              <FieldError message={errors.dataInicio?.message} />
            </div>

            <div data-field="situacao">
              <label className="block text-sm font-medium text-slate-700 mb-2">Situação *</label>
              <select 
                {...register('situacao')} 
                className="w-full h-11 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>

            <div className="lg:col-span-3" data-field="formacaoAcad">
              <label className="block text-sm font-medium text-slate-700 mb-2">Formação Acadêmica</label>
              <Input 
                {...register('formacaoAcad')} 
                placeholder="Ex: Doutorado em Teologia Sistemática" 
                className="h-11"
              />
              <FieldError message={errors.formacaoAcad?.message} />
            </div>
          </FormSection>

          {/* Dados Pessoais */}
          <FormSection
            icon={User}
            title="Dados Pessoais"
            description="Informações pessoais do professor"
          >
            <div data-field="pessoa.nome">
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo *</label>
              <Input 
                {...register('pessoa.nome')} 
                className={`${errors?.pessoa?.nome ? 'border-red-500' : ''} h-11`} 
              />
              <FieldError message={errors?.pessoa?.nome?.message} />
            </div>

            <div data-field="pessoa.sexo">
              <label className="block text-sm font-medium text-slate-700 mb-2">Sexo</label>
              <select 
                {...register('pessoa.sexo')} 
                className="w-full h-11 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
              <FieldError message={errors?.pessoa?.sexo?.message} />
            </div>

            <div data-field="pessoa.email">
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <Input 
                type="email" 
                {...register('pessoa.email')} 
                className={`${errors?.pessoa?.email ? 'border-red-500' : ''} h-11`} 
              />
              <FieldError message={errors?.pessoa?.email?.message} />
            </div>

            <div data-field="pessoa.cpf">
              <label className="block text-sm font-medium text-slate-700 mb-2">CPF</label>
              <Input
                {...register('pessoa.cpf', {
                  onChange: (e) => {
                    const digits = onlyDigits(e.target.value || '');
                    e.target.value = maskCPF(digits);
                  },
                })}
                className="h-11"
              />
              <FieldError message={errors?.pessoa?.cpf?.message} />
            </div>

            <div data-field="pessoa.telefone">
              <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
              <Input
                {...register('pessoa.telefone', {
                  onChange: (e) => {
                    const digits = onlyDigits(e.target.value || '');
                    e.target.value = maskPhone(digits);
                  },
                })}
                className="h-11"
              />
              <FieldError message={errors?.pessoa?.telefone?.message} />
            </div>

            <div data-field="pessoa.data_nascimento">
              <label className="block text-sm font-medium text-slate-700 mb-2">Data de Nascimento</label>
              <Input 
                type="date" 
                {...register('pessoa.data_nascimento')} 
                className="h-11"
              />
              <FieldError message={errors?.pessoa?.data_nascimento?.message} />
            </div>
          </FormSection>

          {/* Endereço */}
          <FormSection
            icon={MapPin}
            title="Endereço"
            description="Informações de localização"
          >
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Logradouro</label>
              <Input 
                value={endereco.logradouro} 
                onChange={(e) => setEndereco(prev => ({ ...prev, logradouro: e.target.value }))} 
                placeholder="Rua, Avenida, etc." 
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Número</label>
              <Input 
                value={endereco.numero} 
                onChange={(e) => setEndereco(prev => ({ ...prev, numero: e.target.value }))} 
                placeholder="Nº" 
                className="h-11"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Bairro</label>
              <Input 
                value={endereco.bairro} 
                onChange={(e) => setEndereco(prev => ({ ...prev, bairro: e.target.value }))} 
                placeholder="Bairro" 
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Complemento</label>
              <Input 
                value={endereco.complemento} 
                onChange={(e) => setEndereco(prev => ({ ...prev, complemento: e.target.value }))} 
                placeholder="Apto, Bloco, etc." 
                className="h-11"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Cidade</label>
              <Input 
                value={endereco.cidade} 
                onChange={(e) => setEndereco(prev => ({ ...prev, cidade: e.target.value }))} 
                placeholder="Cidade" 
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">UF</label>
              <Input 
                value={endereco.estado} 
                onChange={(e) => setEndereco(prev => ({ ...prev, estado: e.target.value.toUpperCase().slice(0, 2) }))} 
                placeholder="SP" 
                maxLength={2}
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">CEP</label>
              <Input 
                value={endereco.cep} 
                onChange={(e) => setEndereco(prev => ({ ...prev, cep: onlyDigits(e.target.value).slice(0, 8) }))} 
                placeholder="00000-000" 
                className="h-11"
              />
            </div>
          </FormSection>

          {/* Actions */}
          <ActionsBar 
            isSubmitting={updateMutation.isPending} 
            submitLabel="Atualizar Professor" 
            submittingLabel="Atualizando..." 
            cancelTo="/professores"
          />
        </form>

        {/* Card: Criar Usuário para Professor sem User */}
        {!relatedUser && professor.pessoaId && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Key className="h-5 w-5" />
                Criar Acesso ao Sistema
              </CardTitle>
              <CardDescription className="text-green-700">
                Este professor ainda não possui credenciais de acesso. Crie um usuário para permitir login no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitUser(onCreateUser, handleUserFormError)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div data-field="username">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Username *</label>
                    <Input 
                      {...registerUser('username')} 
                      placeholder="Ex: joao.silva" 
                      className={`${errorsUser.username ? 'border-red-500' : ''} h-11`} 
                    />
                    <FieldError message={errorsUser.username?.message} />
                  </div>

                  <div data-field="password">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Senha *</label>
                    <Input 
                      type="password" 
                      {...registerUser('password')} 
                      placeholder="Mínimo 6 caracteres"
                      className={`${errorsUser.password ? 'border-red-500' : ''} h-11`} 
                    />
                    <FieldError message={errorsUser.password?.message} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createUserMutation.isPending} className="bg-green-600 hover:bg-green-700">
                    {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                  <p className="text-xs text-slate-600 flex items-center">
                    O usuário será criado com o papel de <strong className="ml-1">Professor</strong>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Card: Editar Usuário Existente */}
        {relatedUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Dados de Usuário
              </CardTitle>
              <CardDescription>
                Atualizar informações de acesso do professor
              </CardDescription>
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
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                    <Input name="user.username" defaultValue={relatedUser.username} className="h-11" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Papel</label>
                    <select 
                      name="user.role" 
                      defaultValue={relatedUser.role} 
                      className="w-full h-11 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value={Role.ADMIN}>Administrador</option>
                      <option value={Role.SECRETARIA}>Secretaria</option>
                      <option value={Role.PROFESSOR}>Professor</option>
                      <option value={Role.ALUNO}>Aluno</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ativo</label>
                    <select 
                      name="user.isActive" 
                      defaultValue={relatedUser.isActive} 
                      className="w-full h-11 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="S">Sim</option>
                      <option value="N">Não</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" disabled={updateUserMutation.isPending} variant="outline">
                  {updateUserMutation.isPending ? 'Atualizando...' : 'Atualizar Usuário'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
