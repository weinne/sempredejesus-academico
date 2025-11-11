import React, { useMemo, useState, useEffect } from 'react';
import { Wand2, User, Building2, MapPin, Key } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import CrudHeader from '@/components/crud/crud-header';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { apiService } from '@/services/api';
import { CreateProfessorWithUser, Pessoa, User as UserType } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useFormErrors } from '@/hooks/use-form-errors';
import { onlyDigits, maskCPF, maskPhone, numberOrUndefined } from '@/lib/form-utils';
import { z } from 'zod';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const pessoaInlineSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  sexo: z.enum(['M', 'F', 'O'], { errorMap: () => ({ message: 'Selecione um sexo válido' }) }).optional(),
  email: z.string().email().optional().or(z.literal('')),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  data_nascimento: z.string().optional(),
});

const professorSchema = z
  .object({
    matricula: z.string().length(8, 'Matrícula deve ter exatamente 8 dígitos'),
    pessoaId: z.number().optional(),
    pessoa: pessoaInlineSchema.optional(),
    dataInicio: z.string().min(1, 'Data de início é obrigatória'),
    formacaoAcad: z.string().max(120, 'Formação deve ter no máximo 120 caracteres').optional(),
    situacao: z.enum(['ATIVO', 'INATIVO']),
    createUser: z.boolean().default(true),
    username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres').max(50, 'Username deve ter no máximo 50 caracteres').optional(),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres').optional(),
  })
  .superRefine((data, ctx) => {
    const hasPessoaId = typeof data.pessoaId === 'number' && data.pessoaId > 0;
    const hasPessoa = !!data.pessoa && !!data.pessoa.nome;
    if (!hasPessoaId && !hasPessoa) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione uma pessoa ou preencha os dados pessoais', path: ['pessoa'] });
    }
    if (hasPessoaId && hasPessoa) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Use pessoa existente OU cadastre uma nova, não ambos', path: ['pessoa'] });
    }
    if (data.createUser) {
      if (!data.username) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['username'], message: 'Username é obrigatório ao criar usuário' });
      }
      if (!data.password) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Senha é obrigatória ao criar usuário' });
      }
    }
  });

type ProfessorFormData = z.infer<typeof professorSchema>;

export default function ProfessorNewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleFormError } = useFormErrors();
  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      situacao: 'ATIVO',
      dataInicio: today,
      createUser: true,
      pessoa: { nome: '' },
    },
  });
  
  const createUser = watch('createUser');
  const pessoaNomeWatch = watch('pessoa.nome');
  const pessoaCpfWatch = watch('pessoa.cpf');
  const selectedPessoaIdRaw = watch('pessoaId');
  const selectedPessoaId = isNaN(Number(selectedPessoaIdRaw)) || !selectedPessoaIdRaw ? undefined : Number(selectedPessoaIdRaw);
  const enderecoStrWatch = watch('pessoa.endereco');

  // Address segmented fields
  const [endLogradouro, setEndLogradouro] = useState('');
  const [endNumero, setEndNumero] = useState('');
  const [endComplemento, setEndComplemento] = useState('');
  const [endBairro, setEndBairro] = useState('');
  const [endCidade, setEndCidade] = useState('');
  const [endEstado, setEndEstado] = useState('');
  const [endCep, setEndCep] = useState('');

  // Sync segmented address when selecting existing pessoa
  useEffect(() => {
    if (!enderecoStrWatch) return;
    try {
      const parsed = typeof enderecoStrWatch === 'string' ? JSON.parse(enderecoStrWatch) : enderecoStrWatch;
      if (parsed && typeof parsed === 'object') {
        setEndLogradouro(parsed.logradouro || '');
        setEndNumero(parsed.numero || '');
        setEndComplemento(parsed.complemento || '');
        setEndBairro(parsed.bairro || '');
        setEndCidade(parsed.cidade || '');
        setEndEstado(parsed.estado || '');
        setEndCep(parsed.cep || '');
      }
    } catch {
      // ignore parsing errors
    }
  }, [enderecoStrWatch]);

  const { data: pessoas = [] } = useQuery({ queryKey: ['pessoas'], queryFn: apiService.getPessoas });
  const [existingUser, setExistingUser] = useState<UserType | null>(null);
  const usersQuery = useQuery({
    queryKey: ['users','byPessoa', selectedPessoaId],
    enabled: !!selectedPessoaId,
    queryFn: async () => {
      const res = await apiService.getUsers({ page: 1, limit: 1000 });
      return res.data.find(u => Number(u.pessoaId) === Number(selectedPessoaId)) || null;
    }
  });
  useEffect(() => { setExistingUser((usersQuery.data as UserType | null) || null); }, [usersQuery.data]);
  const [showPessoaDropdown, setShowPessoaDropdown] = useState(false);
  const [pessoaSearch, setPessoaSearch] = useState('');
  const [confirmPessoa, setConfirmPessoa] = useState<Pessoa | null>(null);
  const filteredPessoas = useMemo(() => {
    const term = pessoaSearch.trim().toLowerCase();
    if (!term) {
      return pessoas.slice(0, 20);
    }
    return pessoas.filter((p) => {
      const normalizedCpf = (p.cpf || '').replace(/\D/g, '');
      const normalizedSearch = term.replace(/\D/g, '');
      return (
        p.nome.toLowerCase().includes(term) ||
        (!!normalizedSearch && normalizedCpf.includes(normalizedSearch)) ||
        (p.email || '').toLowerCase().includes(term)
      );
    }).slice(0, 20);
  }, [pessoas, pessoaSearch]);

  const generateEightDigitId = () => {
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    let result = String(firstDigit);
    while (result.length < 8) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateProfessorWithUser) => apiService.createProfessor(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      toast({ 
        title: 'Professor cadastrado', 
        description: result.user 
          ? `Professor e usuário criados! Username: ${result.user.username}` 
          : 'Professor cadastrado com sucesso!' 
      });
      navigate('/professores');
    },
    onError: (error: any) => toast({ 
      title: 'Erro ao cadastrar professor', 
      description: error.message || 'Erro desconhecido', 
      variant: 'destructive' 
    }),
  });

  const onSubmit = (data: ProfessorFormData) => {
    const enderecoObj = {
      logradouro: endLogradouro,
      numero: endNumero,
      complemento: endComplemento,
      bairro: endBairro,
      cidade: endCidade,
      estado: endEstado,
      cep: endCep,
    };
    
    const payload: CreateProfessorWithUser = {
      ...data,
      pessoa: data.pessoaId ? undefined : {
        ...data.pessoa,
        cpf: data.pessoa?.cpf ? onlyDigits(data.pessoa.cpf) : undefined,
        telefone: data.pessoa?.telefone ? onlyDigits(data.pessoa.telefone) : undefined,
        endereco: JSON.stringify(enderecoObj),
      },
      username: data.createUser ? data.username : undefined,
      password: data.createUser ? data.password : undefined,
    } as CreateProfessorWithUser;
    
    createMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader title="Cadastrar Professor" backTo="/professores" description="Preencha os dados do novo professor" />
      
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
          
          {/* Dados Básicos */}
          <FormSection
            icon={Building2}
            title="Dados Profissionais"
            description="Informações sobre matrícula e situação funcional"
          >
            <div data-field="matricula">
              <label className="block text-sm font-medium text-slate-700 mb-2">Matrícula *</label>
              <div className="relative">
                <Input 
                  {...register('matricula')} 
                  placeholder="8 dígitos" 
                  maxLength={8} 
                  className={`${errors.matricula ? 'border-red-500' : ''} pr-10 h-11`} 
                />
                <button
                  type="button"
                  onClick={() => setValue('matricula', generateEightDigitId(), { shouldValidate: true, shouldDirty: true })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  title="Gerar matrícula automaticamente"
                  aria-label="Gerar matrícula"
                >
                  <Wand2 className="h-4 w-4" />
                </button>
              </div>
              <FieldError message={errors.matricula?.message} />
            </div>

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

            <input type="hidden" {...register('pessoaId', { setValueAs: numberOrUndefined })} />
          </FormSection>

          {/* Seleção de Pessoa */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-slate-900">Vincular Pessoa Existente</h3>
                <p className="text-sm text-slate-500 mt-1">Ou preencha os dados pessoais abaixo</p>
              </div>
              <div className="relative">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPessoaDropdown(v => !v)}>
                  Buscar Pessoa
                </Button>
                {showPessoaDropdown && (
                  <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-3">
                    <Input 
                      placeholder="Buscar por nome, CPF ou email" 
                      value={pessoaSearch} 
                      onChange={(e)=>setPessoaSearch(e.target.value)} 
                      className="mb-2"
                    />
                    <div className="max-h-64 overflow-auto divide-y divide-slate-100">
                      {filteredPessoas.length === 0 && (
                        <div className="p-3 text-sm text-slate-500">Nenhuma pessoa encontrada</div>
                      )}
                      {filteredPessoas.map((p: Pessoa) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left p-3 hover:bg-slate-50 rounded transition-colors"
                          onClick={() => {
                            setValue('pessoaId', Number(p.id), { shouldValidate: true, shouldDirty: true });
                            setValue('pessoa', undefined as any, { shouldValidate: true, shouldDirty: true });
                            setShowPessoaDropdown(false);
                            toast({ title: 'Pessoa selecionada', description: p.nome });
                          }}
                        >
                          <div className="font-medium text-sm text-slate-900">{p.nome}</div>
                          <div className="text-xs text-slate-500 mt-1">{p.cpf || 'CPF não informado'} • {p.email || 'sem email'}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedPessoaId && (
              <div className="border border-slate-200 rounded-md p-4 bg-slate-50">
                {(() => {
                  const selected = (pessoas as Pessoa[]).find(p => Number(p.id) === selectedPessoaId);
                  const addr = (() => {
                    try {
                      const raw = selected?.endereco || '';
                      if (!raw) return null;
                      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                      return parsed && typeof parsed === 'object' ? parsed : null;
                    } catch { return null; }
                  })();
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-slate-900">{selected?.nome}</div>
                      <div className="text-slate-600">{selected?.cpf || 'CPF não informado'} • {selected?.email || 'sem email'}</div>
                      {addr && (
                        <div className="text-slate-600">
                          {addr.logradouro || ''} {addr.numero || ''} {addr.complemento || ''} - {addr.bairro || ''} - {addr.cidade || ''}/{addr.estado || ''} {addr.cep || ''}
                        </div>
                      )}
                      <div className="pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setValue('pessoaId', undefined as any, { shouldValidate: true, shouldDirty: true });
                            setExistingUser(null);
                          }}
                        >
                          Desvincular pessoa
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Dados Pessoais */}
          {!selectedPessoaId && (
            <FormSection
              icon={User}
              title="Dados Pessoais"
              description="Informações pessoais do professor"
            >
              <div data-field="pessoa.nome">
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo *</label>
                <Input
                  {...register('pessoa.nome', {
                    onBlur: () => {
                      const term = (pessoaNomeWatch || '').trim().toLowerCase();
                      if (!term) return;
                      const candidates = pessoas.filter(p => p.nome.toLowerCase().includes(term)).slice(0, 5);
                      if (candidates.length > 0) {
                        setConfirmPessoa(candidates[0]);
                      }
                    }
                  })}
                  placeholder="Nome completo do professor"
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
                  placeholder="email@exemplo.com" 
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
                    onBlur: () => {
                      const digits = (pessoaCpfWatch || '').replace(/\D/g, '');
                      if (digits.length < 11) return;
                      const found = pessoas.find(p => (p.cpf || '').replace(/\D/g, '') === digits);
                      if (found) {
                        setConfirmPessoa(found);
                      }
                    }
                  })}
                  placeholder="000.000.000-00"
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
                  placeholder="(11) 99999-9999"
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
          )}

          {/* Endereço */}
          {!selectedPessoaId && (
            <FormSection
              icon={MapPin}
              title="Endereço"
              description="Informações de localização"
            >
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Logradouro</label>
                <Input 
                  value={endLogradouro} 
                  onChange={(e)=>setEndLogradouro(e.target.value)} 
                  placeholder="Rua, Avenida, etc." 
                  className="h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Número</label>
                <Input 
                  value={endNumero} 
                  onChange={(e)=>setEndNumero(e.target.value)} 
                  placeholder="Nº" 
                  className="h-11"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Bairro</label>
                <Input 
                  value={endBairro} 
                  onChange={(e)=>setEndBairro(e.target.value)} 
                  placeholder="Bairro" 
                  className="h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Complemento</label>
                <Input 
                  value={endComplemento} 
                  onChange={(e)=>setEndComplemento(e.target.value)} 
                  placeholder="Apto, Bloco, etc." 
                  className="h-11"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Cidade</label>
                <Input 
                  value={endCidade} 
                  onChange={(e)=>setEndCidade(e.target.value)} 
                  placeholder="Cidade" 
                  className="h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">UF</label>
                <Input 
                  value={endEstado} 
                  onChange={(e)=>setEndEstado(e.target.value.toUpperCase().slice(0, 2))} 
                  placeholder="SP" 
                  maxLength={2}
                  className="h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">CEP</label>
                <Input 
                  value={endCep} 
                  onChange={(e)=>setEndCep(onlyDigits(e.target.value).slice(0, 8))} 
                  placeholder="00000-000" 
                  className="h-11"
                />
              </div>
            </FormSection>
          )}

          {/* Acesso ao Sistema */}
          <FormSection
            icon={Key}
            title="Acesso ao Sistema"
            description="Configurar login do professor no sistema"
          >
            <div className="lg:col-span-3">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  {...register('createUser')}
                  disabled={!!existingUser}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded disabled:opacity-50"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-900">Criar usuário de acesso para o professor</label>
                  <p className="text-xs text-slate-600 mt-1">
                    Permite que o professor acesse o sistema com username e senha
                  </p>
                </div>
              </div>
              
              {!!existingUser && (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                  Já existe usuário para esta pessoa: <span className="font-medium">{existingUser.username}</span>. 
                  Não é possível criar outro usuário para a mesma pessoa.
                </div>
              )}
            </div>

            {createUser && !existingUser && (
              <>
                <div data-field="username">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Username *</label>
                  <Input 
                    {...register('username')} 
                    placeholder="Ex: joao.silva" 
                    className={`${errors.username ? 'border-red-500' : ''} h-11`} 
                  />
                  <FieldError message={errors.username?.message} />
                </div>

                <div data-field="password">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Senha *</label>
                  <Input 
                    type="password" 
                    {...register('password')} 
                    placeholder="Mínimo 6 caracteres"
                    className={`${errors.password ? 'border-red-500' : ''} h-11`} 
                  />
                  <FieldError message={errors.password?.message} />
                </div>
              </>
            )}
          </FormSection>

          {/* Actions */}
          <ActionsBar 
            isSubmitting={createMutation.isPending} 
            submitLabel="Cadastrar Professor" 
            submittingLabel="Cadastrando..." 
            cancelTo="/professores"
          />
        </form>

        {/* Confirm Pessoa Dialog */}
        <AlertDialog open={!!confirmPessoa} onOpenChange={(open) => { if (!open) setConfirmPessoa(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Selecionar pessoa existente?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmPessoa && (
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">{confirmPessoa.nome}</div>
                    <div className="text-slate-600">{confirmPessoa.cpf || 'CPF não informado'} • {confirmPessoa.email || 'sem email'}</div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmPessoa(null)}>Continuar preenchendo</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (!confirmPessoa) return;
                setValue('pessoaId', Number(confirmPessoa.id), { shouldValidate: true, shouldDirty: true });
                setValue('pessoa', undefined as any, { shouldValidate: true, shouldDirty: true });
                setConfirmPessoa(null);
              }}>Selecionar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
