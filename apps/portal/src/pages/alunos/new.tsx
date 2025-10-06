import React, { useMemo, useState, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Aluno, CreateAlunoWithUser, Pessoa, Curso, Periodo, Turno, Coorte } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import PessoaFormModal from '@/components/modals/pessoa-form-modal';
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

const alunoSchema = z.object({
  ra: z.string().max(8).optional(),
  // Either select existing pessoa or fill inline pessoa
  pessoaId: z.number().optional(),
  pessoa: pessoaInlineSchema.optional(),
  cursoId: z.number().min(1, 'Selecione um curso'),
  turnoId: z.number().optional(),
  coorteId: z.number().optional(),
  periodoId: z.number().min(1, 'Selecione um período'),
  anoIngresso: z.number().min(1900).max(2100),
  igreja: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO']),
  coeficienteAcad: z.number().min(0).max(10).optional(),
  createUser: z.boolean().default(false),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
}).superRefine((data, ctx) => {
  const hasPessoaId = typeof data.pessoaId === 'number' && data.pessoaId > 0;
  const hasPessoa = !!data.pessoa && !!data.pessoa.nome;
  if (!hasPessoaId && !hasPessoa) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione uma pessoa ou preencha os dados de Pessoa', path: ['pessoa'] });
  }
  if (hasPessoaId && hasPessoa) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Use pessoa existente OU cadastre inline, não ambos', path: ['pessoa'] });
  }
});

type AlunoFormData = z.infer<typeof alunoSchema>;

export default function AlunoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPessoaModal, setShowPessoaModal] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: { situacao: 'ATIVO', anoIngresso: new Date().getFullYear(), createUser: false },
  });
  const createUser = watch('createUser');
  const selectedPessoaId = watch('pessoaId');
  const selectedCursoId = watch('cursoId');

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

  useEffect(() => {
    setValue('periodoId', undefined as unknown as number, { shouldValidate: false, shouldDirty: false });
  }, [selectedCursoId, setValue]);

  const generateEightDigitId = () => {
    const firstDigit = Math.floor(Math.random() * 9) + 1; // 1-9 to avoid leading zero
    let result = String(firstDigit);
    while (result.length < 8) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  };

  const { data: pessoas = [] } = useQuery({ queryKey: ['pessoas'], queryFn: apiService.getPessoas });
  const { data: cursosResponse } = useQuery({ queryKey: ['cursos'], queryFn: () => apiService.getCursos({ limit: 100 }) });
  const cursos = cursosResponse?.data || [];
  const { data: turnos = [] } = useQuery({ queryKey: ['turnos'], queryFn: apiService.getTurnos });
  const { data: coortes = [] } = useQuery({ queryKey: ['coortes'], queryFn: apiService.getCoortes });

  const pessoaNomeWatch = watch('pessoa.nome');
  const pessoaCpfWatch = watch('pessoa.cpf');
  const [showPessoaDropdown, setShowPessoaDropdown] = useState(false);
  const [pessoaSearch, setPessoaSearch] = useState('');
  const filteredPessoas = useMemo(() => {
    const term = pessoaSearch.trim().toLowerCase();
    if (!term) return pessoas.slice(0, 20);
    return pessoas.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      (p.cpf || '').replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
      (p.email || '').toLowerCase().includes(term)
    ).slice(0, 20);
  }, [pessoas, pessoaSearch]);
  const [confirmPessoa, setConfirmPessoa] = useState<Pessoa | null>(null);

  const { data: periodosResponse } = useQuery({
    queryKey: ['periodos', selectedCursoId],
    queryFn: () => apiService.getPeriodos({ cursoId: selectedCursoId!, limit: 100 }),
    enabled: !!selectedCursoId,
  });
  const periodos = periodosResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (aluno: CreateAlunoWithUser) => apiService.createAluno(aluno),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast({ title: 'Aluno criado', description: result.user ? `Aluno e usuário criados! Username: ${result.user.username}` : 'Aluno criado com sucesso!' });
      navigate('/alunos');
    },
    onError: (error: any) => toast({ title: 'Erro ao criar aluno', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const createPessoaMutation = useMutation({
    mutationFn: (pessoa: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>) => apiService.createPessoa(pessoa),
    onSuccess: (newPessoa) => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({ title: 'Pessoa criada', description: 'Pessoa criada com sucesso!' });
      setShowPessoaModal(false);
      // Optional: could auto-select new pessoa via setValue if desired
    },
    onError: (error: any) => toast({ title: 'Erro ao criar pessoa', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const onSubmit = (data: AlunoFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Nova Matrícula" backTo="/alunos" description="Cadastro de aluno" />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Nova Matrícula</CardTitle>
              <CardDescription>Complete o formulário para matricular um novo aluno</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Matrícula</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RA (opcional - será gerado automaticamente)</label>
                      <div className="relative">
                        <Input {...register('ra')} placeholder="Ex: 20241001" className={`${errors.ra ? 'border-red-500' : ''} pr-10`} maxLength={8} />
                        <button
                          type="button"
                          onClick={() => setValue('ra', generateEightDigitId(), { shouldValidate: true, shouldDirty: true })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                          title="Gerar RA"
                          aria-label="Gerar RA"
                        >
                          <Wand2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa</label>
                      <div className="flex space-x-2">
                        <select {...register('pessoaId', { valueAsNumber: true })} className={`flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.pessoaId ? 'border-red-500' : ''}`}>
                          <option value="">Selecione uma pessoa existente...</option>
                          {pessoas.map((pessoa) => (
                            <option key={pessoa.id} value={Number(pessoa.id)}>{pessoa.nome} {pessoa.email ? `(${pessoa.email})` : ''}</option>
                          ))}
                        </select>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setValue('pessoaId', undefined as any); setShowPessoaModal(true); }} className="px-3" title="Cadastrar nova pessoa">+
                        </Button>
                      </div>
                      {!selectedPessoaId && <p className="mt-1 text-sm text-gray-500">Você pode escolher uma pessoa existente ou cadastrar os dados abaixo.</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                      <select {...register('cursoId', { valueAsNumber: true })} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.cursoId ? 'border-red-500' : ''}`}>
                        <option value="">Selecione um curso...</option>
                        {cursos.map((curso: Curso) => (
                          <option key={curso.id} value={curso.id}>{curso.nome} ({curso.grau})</option>
                        ))}
                      </select>
                      {errors.cursoId && (<p className="mt-1 text-sm text-red-600">{errors.cursoId.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Período *</label>
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
                      {errors.periodoId && (<p className="mt-1 text-sm text-red-600">{errors.periodoId.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coorte (turma de ingresso)</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ano de Ingresso *</label>
                      <Input type="number" min="1900" max="2100" {...register('anoIngresso', { valueAsNumber: true })} className={errors.anoIngresso ? 'border-red-500' : ''} />
                      {errors.anoIngresso && (<p className="mt-1 text-sm text-red-600">{errors.anoIngresso.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Situação *</label>
                      <select {...register('situacao')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        <option value="ATIVO">Ativo</option>
                        <option value="TRANCADO">Trancado</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coeficiente Acadêmico</label>
                      <Input type="number" step="0.1" min="0" max="10" {...register('coeficienteAcad', { valueAsNumber: true })} placeholder="Ex: 8.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Complementares</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Igreja de Origem</label>
                      <Input {...register('igreja')} placeholder="Nome da igreja" />
                    </div>
                  </div>
                </div>

                {/* Pessoa Inline */}
                {!selectedPessoaId && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Dados Pessoais (Inline)</h3>
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
                                    setValue('pessoa', {
                                      nome: p.nome,
                                      sexo: p.sexo,
                                      email: p.email,
                                      cpf: p.cpf,
                                      telefone: p.telefone,
                                      endereco: p.endereco,
                                      data_nascimento: p.data_nascimento,
                                    } as any, { shouldValidate: false, shouldDirty: false });
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
                        <Input type="email" {...register('pessoa.email')} placeholder="email@exemplo.com" />
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                        <Input {...register('pessoa.endereco')} placeholder="Rua, número, bairro, cidade" />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Acesso ao Sistema</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input type="checkbox" {...register('createUser')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <label className="ml-2 block text-sm text-gray-900">Criar usuário de acesso para o aluno</label>
                    </div>
                    {createUser && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-blue-500 pl-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                          <Input {...register('username')} placeholder="Ex: joao.silva" className={errors.username ? 'border-red-500' : ''} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                          <Input type="password" {...register('password')} className={errors.password ? 'border-red-500' : ''} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Matricular</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/alunos')}>Cancelar</Button>
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
                        setValue('pessoa', {
                          nome: p.nome,
                          sexo: p.sexo,
                          email: p.email,
                          cpf: p.cpf,
                          telefone: p.telefone,
                          endereco: p.endereco,
                          data_nascimento: p.data_nascimento,
                        } as any, { shouldValidate: false, shouldDirty: false });
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
      <PessoaFormModal
        isOpen={showPessoaModal}
        onClose={() => setShowPessoaModal(false)}
        onSubmit={(data) => {
          // If using modal, create pessoa and select it automatically
          createPessoaMutation.mutate(data);
        }}
        isLoading={createPessoaMutation.isPending}
      />
    </div>
  );
}


