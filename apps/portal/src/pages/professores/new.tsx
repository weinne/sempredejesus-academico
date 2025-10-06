import React, { useMemo, useState, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { apiService } from '@/services/api';
import { CreateProfessorWithUser, Pessoa, User } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const pessoaInlineSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sexo: z.enum(['M', 'F', 'O']).optional(),
  email: z.string().email('Email inválido').optional(),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  data_nascimento: z.string().optional(),
});

const professorSchema = z
  .object({
    matricula: z.string().length(8, 'Matrícula deve ter 8 dígitos'),
    pessoaId: z.number().optional(),
    pessoa: pessoaInlineSchema.optional(),
    dataInicio: z.string().min(1, 'Data de início é obrigatória'),
    formacaoAcad: z.string().max(120).optional(),
    situacao: z.enum(['ATIVO', 'INATIVO']),
    createUser: z.boolean().default(false),
    username: z.string().min(3, 'Username mínimo 3').max(50).optional(),
    password: z.string().min(6, 'Senha mínima 6').max(100).optional(),
  })
  .superRefine((data, ctx) => {
    const hasPessoaId = typeof data.pessoaId === 'number' && data.pessoaId > 0;
    const hasPessoa = !!data.pessoa && !!data.pessoa.nome;
    if (!hasPessoaId && !hasPessoa) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione uma pessoa ou preencha os dados de Pessoa', path: ['pessoa'] });
    }
    if (hasPessoaId && hasPessoa) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Use pessoa existente OU cadastre inline, não ambos', path: ['pessoa'] });
    }
    if (data.createUser) {
      if (!data.username) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['username'], message: 'Username é obrigatório' });
      }
      if (!data.password) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Senha é obrigatória' });
      }
    }
  });

type ProfessorFormData = z.infer<typeof professorSchema>;

export default function ProfessorNewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      situacao: 'ATIVO',
      dataInicio: today,
      createUser: false,
      pessoa: { nome: '' },
    },
  });
  const createUser = watch('createUser');
  const pessoaNomeWatch = watch('pessoa.nome');
  const pessoaCpfWatch = watch('pessoa.cpf');
  const selectedPessoaId = watch('pessoaId');
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
  const [existingUser, setExistingUser] = useState<User | null>(null);
  const usersQuery = useQuery({
    queryKey: ['users','byPessoa', selectedPessoaId],
    enabled: !!selectedPessoaId,
    queryFn: async () => {
      const res = await apiService.getUsers({ page: 1, limit: 1000 });
      return res.data.find(u => Number(u.pessoaId) === Number(selectedPessoaId)) || null;
    }
  });
  useEffect(() => { setExistingUser((usersQuery.data as User | null) || null); }, [usersQuery.data]);
  const [showPessoaDropdown, setShowPessoaDropdown] = useState(false);
  const [pessoaSearch, setPessoaSearch] = useState('');
  const [confirmPessoa, setConfirmPessoa] = useState<Pessoa | null>(null);
  const filteredPessoas = useMemo(() => {
    const term = pessoaSearch.trim().toLowerCase();
    if (!term) return pessoas.slice(0, 20);
    return pessoas.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      (p.cpf || '').replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
      (p.email || '').toLowerCase().includes(term)
    ).slice(0, 20);
  }, [pessoas, pessoaSearch]);

  // Masks and normalization helpers
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

  const generateEightDigitId = () => {
    const firstDigit = Math.floor(Math.random() * 9) + 1; // 1-9 to avoid leading zero
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
      toast({ title: 'Professor criado', description: result.user ? `Professor e usuário criados! Username: ${result.user.username}` : 'Professor criado com sucesso!' });
      navigate('/professores');
    },
    onError: (error: any) => toast({ title: 'Erro ao criar professor', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const onSubmit = (data: ProfessorFormData) => {
    // assemble endereco JSON from segmented fields if using inline pessoa
    if (!data.pessoaId) {
      const enderecoObj = {
        logradouro: endLogradouro,
        numero: endNumero,
        complemento: endComplemento,
        bairro: endBairro,
        cidade: endCidade,
        estado: endEstado,
        cep: endCep,
      };
      setValue('pessoa.endereco', JSON.stringify(enderecoObj), { shouldDirty: true, shouldValidate: false });
    }
    const payload: CreateProfessorWithUser = {
      ...data,
      pessoa: data.pessoaId ? undefined : {
        ...data.pessoa,
        cpf: onlyDigits(data.pessoa?.cpf || ''),
        telefone: onlyDigits(data.pessoa?.telefone || ''),
      },
      username: data.createUser ? data.username : undefined,
      password: data.createUser ? data.password : undefined,
    } as CreateProfessorWithUser;
    createMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Novo Professor" backTo="/professores" description="Cadastro de professor" />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Novo Professor</CardTitle>
              <CardDescription>Complete o formulário para cadastrar um professor</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Básicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula *</label>
                      <div className="relative">
                        <Input {...register('matricula')} placeholder="8 dígitos" maxLength={8} className={`${errors.matricula ? 'border-red-500' : ''} pr-10`} />
                        <button
                          type="button"
                          onClick={() => setValue('matricula', generateEightDigitId(), { shouldValidate: true, shouldDirty: true })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                          title="Gerar matrícula"
                          aria-label="Gerar matrícula"
                        >
                          <Wand2 className="h-4 w-4" />
                        </button>
                      </div>
                      {errors.matricula && (<p className="mt-1 text-sm text-red-600">{errors.matricula.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
                      <Input type="date" {...register('dataInicio')} className={errors.dataInicio ? 'border-red-500' : ''} />
                      {errors.dataInicio && (<p className="mt-1 text-sm text-red-600">{errors.dataInicio.message}</p>)}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Formação Acadêmica</label>
                      <Input {...register('formacaoAcad')} placeholder="Ex: Doutorado em Teologia" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Situação *</label>
                      <select {...register('situacao')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        <option value="ATIVO">Ativo</option>
                        <option value="INATIVO">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Dados Pessoais</h3>
                    <div className="relative">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowPessoaDropdown(v => !v)}>
                        Selecionar existente
                      </Button>
                      {showPessoaDropdown && (
                        <div className="absolute right-0 mt-2 w-96 bg-white border rounded-md shadow-lg z-10 p-2">
                          <Input placeholder="Buscar por nome, CPF ou email" value={pessoaSearch} onChange={(e)=>setPessoaSearch(e.target.value)} />
                          <div className="max-h-64 overflow-auto divide-y">
                            {filteredPessoas.length === 0 && (
                              <div className="p-3 text-sm text-slate-500">Nenhuma pessoa encontrada</div>
                            )}
                            {filteredPessoas.map((p: Pessoa) => (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full text-left p-2 hover:bg-slate-50"
                                onClick={() => {
                                  setValue('pessoaId', Number(p.id), { shouldValidate: true, shouldDirty: true });
                                  setValue('pessoa', undefined as any, { shouldValidate: true, shouldDirty: true });
                                  setShowPessoaDropdown(false);
                                  toast({ title: 'Pessoa selecionada', description: p.nome });
                                }}
                              >
                                <div className="font-medium text-sm">{p.nome}</div>
                                <div className="text-xs text-slate-500">{p.cpf || 'CPF não informado'} • {p.email || 'sem email'}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!selectedPessoaId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
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
                        placeholder="Nome completo"
                        className={errors?.pessoa?.nome ? 'border-red-500' : ''}
                      />
                      {errors?.pessoa?.nome && (<p className="mt-1 text-sm text-red-600">{errors.pessoa.nome.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                      <select {...register('pessoa.sexo')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="O">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input type="email" {...register('pessoa.email')} placeholder="email@exemplo.com" className={errors?.pessoa?.email ? 'border-red-500' : ''} />
                      {errors?.pessoa?.email && (<p className="mt-1 text-sm text-red-600">{errors.pessoa.email.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
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
                        placeholder="Somente números"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                      <Input
                        {...register('pessoa.telefone', {
                          onChange: (e) => {
                            const digits = onlyDigits(e.target.value || '');
                            e.target.value = maskPhone(digits);
                          },
                        })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                      <Input type="date" {...register('pessoa.data_nascimento')} />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <Input value={endLogradouro} onChange={(e)=>setEndLogradouro(e.target.value)} placeholder="Logradouro" className="md:col-span-3" />
                        <Input value={endNumero} onChange={(e)=>setEndNumero(e.target.value)} placeholder="Número" className="md:col-span-1" />
                        <Input value={endComplemento} onChange={(e)=>setEndComplemento(e.target.value)} placeholder="Complemento" className="md:col-span-2" />
                        <Input value={endBairro} onChange={(e)=>setEndBairro(e.target.value)} placeholder="Bairro" className="md:col-span-2" />
                        <Input value={endCidade} onChange={(e)=>setEndCidade(e.target.value)} placeholder="Cidade" className="md:col-span-2" />
                        <Input value={endEstado} onChange={(e)=>setEndEstado(e.target.value)} placeholder="UF" className="md:col-span-1" />
                        <Input value={endCep} onChange={(e)=>setEndCep(e.target.value)} placeholder="CEP" className="md:col-span-1" />
                      </div>
                    </div>
                  </div>
                  )}

                  {selectedPessoaId && (
                    <div className="border rounded-md p-4 bg-slate-50">
                      {(() => {
                        const selected = (pessoas as Pessoa[]).find(p => Number(p.id) === Number(selectedPessoaId));
                        const addr = (() => {
                          try {
                            const raw = selected?.endereco || '';
                            if (!raw) return null;
                            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                            return parsed && typeof parsed === 'object' ? parsed : null;
                          } catch { return null; }
                        })();
                        return (
                          <div className="space-y-1 text-sm">
                            <div className="font-medium">{selected?.nome}</div>
                            <div className="text-slate-600">{selected?.cpf || 'CPF não informado'} • {selected?.email || 'sem email'}</div>
                            {addr && (
                              <div className="text-slate-600">
                                {addr.logradouro || ''} {addr.numero || ''} {addr.complemento || ''} - {addr.bairro || ''} - {addr.cidade || ''}/{addr.estado || ''} {addr.cep || ''}
                              </div>
                            )}
                            <div className="pt-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setValue('pessoaId', undefined as any, { shouldValidate: true, shouldDirty: true })}>
                                Desvincular pessoa
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Acesso ao Sistema</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('createUser')}
                        disabled={!!existingUser}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <label className="ml-2 block text-sm text-gray-900">Criar usuário de acesso para o professor</label>
                    </div>
                    {!!existingUser && (
                      <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                        Já existe usuário para esta pessoa: <span className="font-medium">{existingUser.username}</span>. Use o usuário existente.
                      </div>
                    )}
                    {createUser && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-blue-500 pl-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                          <Input {...register('username')} placeholder="Ex: maria.souza" className={errors.username ? 'border-red-500' : ''} disabled={!!existingUser} />
                          {errors.username && (<p className="mt-1 text-sm text-red-600">{errors.username.message}</p>)}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                          <Input type="password" {...register('password')} className={errors.password ? 'border-red-500' : ''} disabled={!!existingUser} />
                          {errors.password && (<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Cadastrar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/professores')}>Cancelar</Button>
                </div>

                <AlertDialog open={!!confirmPessoa} onOpenChange={(open) => { if (!open) setConfirmPessoa(null); }}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Selecionar pessoa existente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {confirmPessoa ? (
                          <div className="space-y-1 text-sm">
                            <div className="font-medium">{confirmPessoa.nome}</div>
                            <div className="text-slate-600">{confirmPessoa.cpf || 'CPF não informado'} • {confirmPessoa.email || 'sem email'}</div>
                          </div>
                        ) : null}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setConfirmPessoa(null)}>Continuar preenchendo</AlertDialogCancel>
                      <AlertDialogAction onClick={() => {
                        if (!confirmPessoa) return;
                        const p = confirmPessoa;
                        setValue('pessoaId', Number(p.id), { shouldValidate: true, shouldDirty: true });
                        setValue('pessoa', undefined as any, { shouldValidate: true, shouldDirty: true });
                        setConfirmPessoa(null);
                      }}>Selecionar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


