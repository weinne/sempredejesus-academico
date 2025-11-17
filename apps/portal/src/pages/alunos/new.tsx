import React, { useMemo, useState, useEffect } from 'react';
import { Wand2, User, GraduationCap, MapPin } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { apiService } from '@/services/api';
import { CreateAlunoWithUser, Pessoa, Curso, Periodo, Turno, Coorte } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import PessoaFormModal from '@/components/modals/pessoa-form-modal';
import { z } from 'zod';
import { useForm, type FieldErrors, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePicker } from '@/components/ui/date-picker';

const pessoaInlineSchema = z.object({
  nome: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
  sexo: z
    .enum(['M', 'F', 'O'], {
      invalid_type_error: 'Sexo inválido',
      required_error: 'Sexo inválido',
    })
    .optional(),
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
  cursoId: z.number({ required_error: 'Selecione um curso' }).min(1, 'Selecione um curso'),
  turnoId: z.number().optional(),
  coorteId: z.number().optional(),
  periodoId: z.number({ required_error: 'Selecione um período' }).min(1, 'Selecione um período'),
  igreja: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO']),
  coeficienteAcad: z.number().min(0).max(10).optional(),
  createUser: z.boolean().default(true),
  username: z
    .string({ required_error: 'Username é obrigatório', invalid_type_error: 'Username inválido' })
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(50, 'Username deve ter no máximo 50 caracteres')
    .optional(),
  password: z
    .string({ required_error: 'Senha é obrigatória', invalid_type_error: 'Senha inválida' })
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .optional(),
}).superRefine((data, ctx) => {
  const hasPessoaId = typeof data.pessoaId === 'number' && data.pessoaId > 0;
  const hasPessoa = !!data.pessoa && !!data.pessoa.nome;
  if (!hasPessoaId && !hasPessoa) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione uma pessoa ou preencha os dados de Pessoa', path: ['pessoa'] });
  }
  if (hasPessoaId && hasPessoa) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Use pessoa existente OU cadastre inline, não ambos', path: ['pessoa'] });
  }
  // Se for criar usuário, exigir username e senha com tamanhos mínimos
  if (data.createUser) {
    if (!data.username || data.username.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um username com pelo menos 3 caracteres',
        path: ['username'],
      });
    }
    if (!data.password || data.password.trim().length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe uma senha com pelo menos 6 caracteres',
        path: ['password'],
      });
    }
  }
});

type AlunoFormData = z.infer<typeof alunoSchema>;

export default function AlunoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPessoaModal, setShowPessoaModal] = useState(false);

  const { register, handleSubmit, watch, setValue, setError, clearErrors, control, formState: { errors } } = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: { situacao: 'ATIVO', createUser: true },
  });
  const createUser = watch('createUser');
  const selectedPessoaIdRaw = watch('pessoaId');
  const selectedCursoIdRaw = watch('cursoId');
  const selectedTurnoIdRaw = watch('turnoId');
  
  // Garantir que os IDs sejam números válidos ou undefined
  const selectedPessoaId = selectedPessoaIdRaw && !isNaN(Number(selectedPessoaIdRaw)) ? Number(selectedPessoaIdRaw) : undefined;
  const selectedCursoId = selectedCursoIdRaw && !isNaN(Number(selectedCursoIdRaw)) ? Number(selectedCursoIdRaw) : undefined;
  const selectedTurnoId = selectedTurnoIdRaw && !isNaN(Number(selectedTurnoIdRaw)) ? Number(selectedTurnoIdRaw) : undefined;

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
    // Limpar período, turno e coorte quando o curso mudar
    setValue('periodoId', undefined as unknown as number, { shouldValidate: false, shouldDirty: false });
    setValue('turnoId', undefined as unknown as number, { shouldValidate: false, shouldDirty: false });
    setValue('coorteId', undefined as unknown as number, { shouldValidate: false, shouldDirty: false });
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
  const { data: turnosAll = [] } = useQuery({ 
    queryKey: ['turnos', selectedCursoId], 
    queryFn: () => apiService.getTurnos(selectedCursoId ? { cursoId: selectedCursoId } : undefined),
    enabled: true,
  });
  const { data: coortesAll = [] } = useQuery({ 
    queryKey: ['coortes', selectedCursoId, selectedTurnoId], 
    queryFn: () => apiService.getCoortes({ cursoId: selectedCursoId, turnoId: selectedTurnoId }),
    enabled: !!selectedCursoId,
  });
  // Currículos do curso selecionado para mapear os turnos disponíveis
  const { data: curriculosDoCurso = [] } = useQuery({
    queryKey: ['curriculos', selectedCursoId],
    queryFn: () => apiService.getCurriculos({ cursoId: selectedCursoId!, ativo: true }),
    enabled: !!selectedCursoId,
  });

  // Coortes disponíveis por curso (e opcionalmente por turno selecionado)
  const coortesDisponiveis = useMemo(() => {
    if (!selectedCursoId) return [];
    const curriculoIds = new Set((curriculosDoCurso as any[]).map(c => Number(c.id)));
    const base = (coortesAll as any[]).filter(c => curriculoIds.has(Number(c.curriculoId)));
    if (selectedTurnoId) {
      return base.filter(c => Number(c.turnoId) === Number(selectedTurnoId));
    }
    return base;
  }, [selectedCursoId, selectedTurnoId, coortesAll, curriculosDoCurso]);

  // Turnos disponíveis: derivados das coortes do curso (mais robusto)
  const turnosDisponiveis = useMemo(() => {
    if (!selectedCursoId) return [];
    const turnoIds = Array.from(new Set((curriculosDoCurso as any[]).map(c => Number(c.turnoId))));
    return (turnosAll as any[]).filter(t => turnoIds.includes(Number(t.id)));
  }, [selectedCursoId, curriculosDoCurso, turnosAll]);

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
  const enderecoStrWatch = watch('pessoa.endereco');
  const [endLogradouro, setEndLogradouro] = useState('');
  const [endNumero, setEndNumero] = useState('');
  const [endComplemento, setEndComplemento] = useState('');
  const [endBairro, setEndBairro] = useState('');
  const [endCidade, setEndCidade] = useState('');
  const [endEstado, setEndEstado] = useState('');
  const [endCep, setEndCep] = useState('');

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
      // ignore
    }
  }, [enderecoStrWatch]);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({ title: 'Pessoa criada', description: 'Pessoa criada com sucesso!' });
      setShowPessoaModal(false);
      // Optional: could auto-select new pessoa via setValue if desired
    },
    onError: (error: any) => toast({ title: 'Erro ao criar pessoa', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const fieldLabels: Record<string, string> = {
    'cursoId': 'Curso',
    'periodoId': 'Período',
    'turnoId': 'Turno',
    'coorteId': 'Coorte',
    'pessoa.nome': 'Nome completo',
    'pessoa.cpf': 'CPF',
    'pessoa.email': 'Email',
    'pessoa.telefone': 'Telefone',
    'username': 'Username',
    'password': 'Senha',
  };

  const getFirstErrorMessage = (errs: FieldErrors<AlunoFormData>): { pathKey: string; message: string } | null => {
    for (const key of Object.keys(errs)) {
      const err: any = (errs as any)[key];
      if (!err) continue;
      if (typeof err.message === 'string' && err.message) return { pathKey: key, message: err.message };
      if (err.types) {
        const first = Object.values(err.types)[0];
        if (typeof first === 'string') return { pathKey: key, message: first };
      }
      if (typeof err === 'object') {
        const nested = getFirstErrorMessage(err);
        if (nested) return nested;
      }
    }
    return null;
  };

  const onInvalid = (errs: FieldErrors<AlunoFormData>) => {
    const first = getFirstErrorMessage(errs);
    const msg = first?.message || 'Verifique os campos obrigatórios.';
    const label = first?.pathKey && fieldLabels[first.pathKey] ? ` (${fieldLabels[first.pathKey]})` : '';
    toast({ title: 'Formulário incompleto', description: `${msg}${label}`, variant: 'destructive' });
    // Tentar focar/rolar até o campo correspondente
    if (first?.pathKey) {
      const el = document.querySelector(`[data-field="${first.pathKey}"]`) as HTMLElement | null;
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if ('focus' in el && typeof (el as any).focus === 'function') (el as any).focus();
        }, 50);
      }
    }
  };

  const onSubmit = (data: AlunoFormData) => {
    // Normalizar payload antes de enviar
    let pessoaPayload = undefined as AlunoFormData['pessoa'] | undefined;
    if (!data.pessoaId && data.pessoa) {
      const enderecoObj = {
        logradouro: endLogradouro,
        numero: endNumero,
        complemento: endComplemento,
        bairro: endBairro,
        cidade: endCidade,
        estado: endEstado,
        cep: endCep,
      };
      pessoaPayload = {
        ...data.pessoa,
        // Enviar dígitos puros para o backend (Zod espera 11 dígitos)
        cpf: data.pessoa.cpf ? onlyDigits(data.pessoa.cpf) : undefined,
        telefone: data.pessoa.telefone ? onlyDigits(data.pessoa.telefone) : undefined,
        endereco: JSON.stringify(enderecoObj),
      };
    }

    // Adicionar anoIngresso automaticamente (ano atual)
    const payload: any = {
      ...data,
      pessoa: pessoaPayload,
      anoIngresso: new Date().getFullYear(),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <CrudHeader title="Nova Matrícula" backTo="/alunos" description="Cadastro de aluno" />
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Nova Matrícula</h1>
            <p className="mt-1 text-sm text-slate-600">Complete o formulário para matricular um novo aluno</p>
          </div>

          {/* Form Content */}
          <div className="px-8 py-6">
              <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                {/* Seção 1: Dados da Matrícula */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Dados da Matrícula</h2>
                      <p className="text-sm text-slate-500">Informações acadêmicas do aluno</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
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
                    <input
                      type="hidden"
                      {...register('pessoaId', {
                        setValueAs: (v) => (v === '' || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
                      })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                      <select
                        {...register('cursoId', {
                          setValueAs: (v) => (v === '' || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
                        })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.cursoId ? 'border-red-500' : ''}`}
                      >
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
                        {...register('periodoId', {
                          setValueAs: (v) => (v === '' || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
                        })}
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
                        {...register('turnoId', { 
                          setValueAs: (value) => value === '' || value === undefined ? undefined : Number(value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione um turno...</option>
                        {turnosDisponiveis.map((t: Turno) => (
                          <option key={t.id} value={t.id}>{t.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coorte (turma de ingresso)</label>
                      <select
                        {...register('coorteId', { 
                          setValueAs: (value) => value === '' || value === undefined ? undefined : Number(value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!selectedCursoId}
                      >
                        <option value="">{selectedCursoId ? 'Selecione uma coorte...' : 'Selecione um curso primeiro'}</option>
                        {coortesDisponiveis.map((c: Coorte) => (
                          <option key={c.id} value={c.id}>{c.rotulo}</option>
                        ))}
                      </select>
                      {selectedCursoId && coortesDisponiveis.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">Nenhuma coorte disponível para este curso</p>
                      )}
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
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        {...register('coeficienteAcad', {
                          setValueAs: (v) => (v === '' || v === undefined ? undefined : Number(v)),
                        })}
                        placeholder="Ex: 8.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Separador */}
                <div className="border-t border-slate-200"></div>

                {/* Seção 2: Dados Complementares */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Dados Complementares</h2>
                      <p className="text-sm text-slate-500">Informações adicionais sobre o aluno</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Igreja de Origem</label>
                      <Input {...register('igreja')} placeholder="Nome da igreja" className="h-11" />
                    </div>
                  </div>
                </div>

                {/* Separador */}
                <div className="border-t border-slate-200"></div>

                {/* Seção 3: Dados Pessoais */}
                {!selectedPessoaId && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">Dados Pessoais</h2>
                          <p className="text-sm text-slate-500">Informações da pessoa vinculada ao aluno</p>
                        </div>
                      </div>
                      <div className="relative">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowPessoaDropdown(v => !v)}>
                          <User className="w-4 h-4 mr-2" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
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
                        <Controller
                          name="pessoa.data_nascimento"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              value={field.value || null}
                              onChange={field.onChange}
                              placeholder="dd/mm/aaaa"
                            />
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Subseção de Endereço */}
                    <div className="pt-4 border-t border-slate-100">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Endereço</label>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-3">
                          <Input value={endLogradouro} onChange={(e)=>setEndLogradouro(e.target.value)} placeholder="Logradouro" className="h-11" />
                        </div>
                        <div className="md:col-span-1">
                          <Input value={endNumero} onChange={(e)=>setEndNumero(e.target.value)} placeholder="Número" className="h-11" />
                        </div>
                        <div className="md:col-span-2">
                          <Input value={endComplemento} onChange={(e)=>setEndComplemento(e.target.value)} placeholder="Complemento" className="h-11" />
                        </div>
                        <div className="md:col-span-2">
                          <Input value={endBairro} onChange={(e)=>setEndBairro(e.target.value)} placeholder="Bairro" className="h-11" />
                        </div>
                        <div className="md:col-span-2">
                          <Input value={endCidade} onChange={(e)=>setEndCidade(e.target.value)} placeholder="Cidade" className="h-11" />
                        </div>
                        <div className="md:col-span-1">
                          <Input value={endEstado} onChange={(e)=>setEndEstado(e.target.value)} placeholder="UF" className="h-11" maxLength={2} />
                        </div>
                        <div className="md:col-span-1">
                          <Input value={endCep} onChange={(e)=>setEndCep(e.target.value)} placeholder="CEP" className="h-11" />
                        </div>
                      </div>
                    </div>
                    {errors?.pessoa && (
                      <p className="text-sm text-red-600">Selecione uma pessoa ou preencha os dados de Pessoa</p>
                    )}
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

                {/* Separador */}
                <div className="border-t border-slate-200"></div>

                {/* Seção 4: Acesso ao Sistema */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Acesso ao Sistema</h2>
                      <p className="text-sm text-slate-500">Configurações de login do aluno</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input 
                          type="checkbox" 
                          {...register('createUser')} 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                      </div>
                      <div className="ml-3">
                        <label className="text-sm font-medium text-slate-900">Criar usuário de acesso para o aluno</label>
                        <p className="text-sm text-slate-500">O aluno poderá fazer login no sistema</p>
                      </div>
                    </div>
                    {createUser && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 p-5 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Username *</label>
                          <Input 
                            {...register('username')} 
                            placeholder="Ex: joao.silva" 
                            className={`h-11 ${errors.username ? 'border-red-500' : ''}`} 
                          />
                          {errors.username && (
                            <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Senha *</label>
                          <Input 
                            type="password" 
                            {...register('password')} 
                            placeholder="Mínimo 6 caracteres"
                            className={`h-11 ${errors.password ? 'border-red-500' : ''}`} 
                          />
                          {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do formulário */}
                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="px-8 h-11"
                  >
                    {createMutation.isPending ? 'Matriculando...' : 'Matricular Aluno'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/alunos')}
                    className="px-8 h-11"
                  >
                    Cancelar
                  </Button>
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
          </div>
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


