import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  DirectusAlunoCandidate,
  DirectusProfessorCandidate,
  DirectusAlunoImportItem,
  DirectusProfessorImportItem,
  DirectusAlunoImportPayload,
  DirectusProfessorImportPayload,
  Curso,
  Turno,
  Coorte,
} from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, UploadCloud, UserPlus, GraduationCap, Users } from 'lucide-react';

const alunoFormSchema = z
  .object({
    cursoId: z.coerce.number().int().positive({ message: 'Selecione um curso' }),
    periodoId: z.coerce.number().int().positive({ message: 'Selecione um período' }),
    turnoId: z.coerce.number().int().optional(),
    coorteId: z.coerce.number().int().optional(),
    anoIngresso: z.coerce.number().int().min(2000).max(2100),
    situacao: z.enum(['ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO']),
    igreja: z.string().max(120).optional().or(z.literal('')),
    createUser: z.boolean().default(true),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(6).max(100).optional(),
    pessoa: z.object({
      nome: z.string().min(2, 'Informe o nome'),
      email: z.string().email('Email inválido').optional().or(z.literal('')),
      telefone: z.string().optional().or(z.literal('')),
      cpf: z.string().optional().or(z.literal('')),
      sexo: z.enum(['M', 'F', 'O']).optional(),
      data_nascimento: z.string().optional().or(z.literal('')),
      endereco: z.string().optional().or(z.literal('')),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.createUser) {
      if (!data.username || data.username.trim().length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['username'], message: 'Informe um username válido' });
      }
      if (!data.password || data.password.trim().length < 6) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Informe uma senha válida' });
      }
    }
  });

type AlunoFormValues = z.infer<typeof alunoFormSchema>;

const professorFormSchema = z
  .object({
    matricula: z.string().min(4, 'Matrícula obrigatória'),
    dataInicio: z.string().min(4, 'Data obrigatória'),
    formacaoAcad: z.string().optional().or(z.literal('')),
    situacao: z.enum(['ATIVO', 'INATIVO']),
    createUser: z.boolean().default(true),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(6).max(100).optional(),
    pessoa: z.object({
      nome: z.string().min(2, 'Informe o nome'),
      email: z.string().email('Email inválido').optional().or(z.literal('')),
      telefone: z.string().optional().or(z.literal('')),
      cpf: z.string().optional().or(z.literal('')),
      sexo: z.enum(['M', 'F', 'O']).optional(),
      data_nascimento: z.string().optional().or(z.literal('')),
      endereco: z.string().optional().or(z.literal('')),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.createUser) {
      if (!data.username || data.username.trim().length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['username'], message: 'Informe um username válido' });
      }
      if (!data.password || data.password.trim().length < 6) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Informe uma senha válida' });
      }
    }
  });

type ProfessorFormValues = z.infer<typeof professorFormSchema>;

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch {
    return value;
  }
};

const deriveUsername = (email?: string | null, fallback?: string) => {
  if (email && email.includes('@')) {
    return email.split('@')[0]?.slice(0, 24) || 'usuario';
  }
  if (fallback) {
    return fallback
      .normalize('NFD')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 24)
      .toLowerCase() || 'usuario';
  }
  return 'usuario';
};

const generatePassword = () => Math.random().toString(36).slice(-8);
const generateMatricula = () => `${Math.floor(10000000 + Math.random() * 89999999)}`;

interface DirectusImportPanelProps {
  disabled?: boolean;
}

export function DirectusImportPanel({ disabled }: DirectusImportPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'alunos' | 'professores'>('alunos');
  const [selectedAluno, setSelectedAluno] = useState<DirectusAlunoCandidate | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<DirectusProfessorCandidate | null>(null);
  const alunoFormRef = useRef<HTMLDivElement | null>(null);
  const professorFormRef = useRef<HTMLDivElement | null>(null);

  const cursosQuery = useQuery({
    queryKey: ['import', 'cursos'],
    queryFn: () => apiService.getCursos({ limit: 200 }),
    staleTime: 1000 * 60 * 10,
  });
  const cursos = cursosQuery.data?.data ?? [];

  const turnosQuery = useQuery({
    queryKey: ['import', 'turnos'],
    queryFn: () => apiService.getTurnos(),
    staleTime: 1000 * 60 * 10,
  });
  const turnos = turnosQuery.data ?? [];

  const coortesQuery = useQuery({
    queryKey: ['import', 'coortes'],
    queryFn: () => apiService.getCoortes(),
    staleTime: 1000 * 60 * 10,
  });
  const coortes = coortesQuery.data ?? [];

  const alunosQuery = useQuery({
    queryKey: ['directus', 'alunos'],
    queryFn: () => apiService.getDirectusAlunoCandidates(),
    enabled: false,
  });

  const professoresQuery = useQuery({
    queryKey: ['directus', 'professores'],
    queryFn: () => apiService.getDirectusProfessorCandidates(),
    enabled: false,
  });

  const importAlunoMutation = useMutation({
    mutationFn: (payload: DirectusAlunoImportPayload) => apiService.importDirectusAlunos(payload),
  });

  const importProfessorMutation = useMutation({
    mutationFn: (payload: DirectusProfessorImportPayload) => apiService.importDirectusProfessores(payload),
  });

  useEffect(() => {
    if (selectedAluno && alunoFormRef.current) {
      alunoFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedAluno]);

  useEffect(() => {
    if (selectedProfessor && professorFormRef.current) {
      professorFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedProfessor]);

  const handleAlunoImport = async (item: DirectusAlunoImportItem) => {
    try {
      const result = await importAlunoMutation.mutateAsync({ items: [item] });
      const imported = result?.[0];
      toast({
        title: 'Aluno importado',
        description: imported?.ra ? `Matrícula gerada: ${imported.ra}` : 'Aluno criado com sucesso',
      });
      setSelectedAluno(null);
      alunosQuery.refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao importar aluno',
        description: error?.message || 'Não foi possível concluir a importação',
        variant: 'destructive',
      });
    }
  };

  const handleProfessorImport = async (item: DirectusProfessorImportItem) => {
    try {
      const result = await importProfessorMutation.mutateAsync({ items: [item] });
      const imported = result?.[0];
      toast({
        title: 'Professor importado',
        description: imported?.matricula ? `Matrícula: ${imported.matricula}` : 'Professor criado com sucesso',
      });
      setSelectedProfessor(null);
      professoresQuery.refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao importar professor',
        description: error?.message || 'Não foi possível concluir a importação',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card id="integracoes-directus" className="mt-8 border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-xl">Integração com Directus CMS</CardTitle>
            <CardDescription>
              Busque lead de matrículas e professores cadastrados no site institucional, selecione e conclua o cadastro em poucos cliques.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Beta
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'alunos' | 'professores')}>
          <TabsList className="mb-6">
            <TabsTrigger value="alunos" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Matrículas do site
            </TabsTrigger>
            <TabsTrigger value="professores" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipe acadêmica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alunos">
            <ImportList
              title="Submissões de novos alunos"
              description="Carregue as submissões do formulário de interesse e finalize apenas o que desejar."
              disabled={disabled}
              isLoading={alunosQuery.isFetching}
              error={alunosQuery.error as Error | undefined}
              fetchedAt={alunosQuery.data?.fetchedAt}
              onReload={() => alunosQuery.refetch()}
              items={alunosQuery.data?.items ?? []}
              columns={[
                {
                  label: 'Aluno',
                  render: (item: DirectusAlunoCandidate) => (
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.email || 'Email não informado'}</p>
                    </div>
                  ),
                },
                {
                  label: 'Curso',
                  render: (item: DirectusAlunoCandidate) => item.course?.title || item.course?.slug || 'Não informado',
                },
                {
                  label: 'Criado em',
                  render: (item: DirectusAlunoCandidate) => formatDate(item.createdAt),
                },
                {
                  label: 'Status',
                  render: (item: DirectusAlunoCandidate) => (
                    <Badge variant="outline" className="capitalize">
                      {item.status || 'novo'}
                    </Badge>
                  ),
                },
              ]}
              onSelect={(item) => {
                setSelectedAluno(item as DirectusAlunoCandidate);
                setSelectedProfessor(null);
              }}
            />

            {selectedAluno && (
              <div ref={alunoFormRef}>
                <AlunoImportForm
                  key={selectedAluno.id}
                  candidate={selectedAluno}
                  cursos={cursos}
                  turnos={turnos}
                  coortes={coortes}
                  isSubmitting={importAlunoMutation.isPending}
                  onCancel={() => setSelectedAluno(null)}
                  onSubmit={handleAlunoImport}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="professores">
            <ImportList
              title="Membros da equipe"
              description="Sincronize o time publicado no site e habilite o acesso ao portal."
              disabled={disabled}
              isLoading={professoresQuery.isFetching}
              error={professoresQuery.error as Error | undefined}
              fetchedAt={professoresQuery.data?.fetchedAt}
              onReload={() => professoresQuery.refetch()}
              items={professoresQuery.data?.items ?? []}
              columns={[
                {
                  label: 'Nome',
                  render: (item: DirectusProfessorCandidate) => (
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.position || 'Função não informada'}</p>
                    </div>
                  ),
                },
                {
                  label: 'Bio',
                  render: (item: DirectusProfessorCandidate) => (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.bio || 'Sem biografia publicada'}
                    </p>
                  ),
                },
                {
                  label: 'Status',
                  render: (item: DirectusProfessorCandidate) => (
                    <Badge variant="outline" className="capitalize">
                      {item.status || 'publicado'}
                    </Badge>
                  ),
                },
              ]}
              onSelect={(item) => {
                setSelectedProfessor(item as DirectusProfessorCandidate);
                setSelectedAluno(null);
              }}
            />

            {selectedProfessor && (
              <div ref={professorFormRef}>
                <ProfessorImportForm
                  key={selectedProfessor.id}
                  candidate={selectedProfessor}
                  isSubmitting={importProfessorMutation.isPending}
                  onCancel={() => setSelectedProfessor(null)}
                  onSubmit={handleProfessorImport}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ImportListProps<T> {
  title: string;
  description: string;
  items: T[];
  columns: Array<{ label: string; render: (item: T) => React.ReactNode }>;
  isLoading: boolean;
  error?: Error;
  fetchedAt?: string;
  disabled?: boolean;
  onReload: () => void;
  onSelect: (item: T) => void;
}

function ImportList<T extends { id: string | number }>({
  title,
  description,
  items,
  columns,
  isLoading,
  error,
  fetchedAt,
  disabled,
  onReload,
  onSelect,
}: ImportListProps<T>) {
  return (
    <Card className="mb-6 border border-dashed">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {fetchedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Última sincronização: {formatDate(fetchedAt)}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onReload} disabled={isLoading || disabled}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Carregar</span>
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 rounded-md bg-red-50 text-sm text-red-600">
            Não foi possível acessar o Directus. Verifique as credenciais e tente novamente.
          </div>
        ) : items.length === 0 && !isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhum registro retornado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.label}>{column.label}</TableHead>
                ))}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando registros do Directus...
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={String(item.id)}>
                    {columns.map((column) => (
                      <TableCell key={column.label}>{column.render(item)}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button variant="secondary" size="sm" onClick={() => onSelect(item)}>
                        Preparar importação
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableCaption>Os dados retornam direto do Directus (limite 200 registros mais recentes).</TableCaption>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

interface AlunoImportFormProps {
  candidate: DirectusAlunoCandidate;
  cursos: Curso[];
  turnos: Turno[];
  coortes: Coorte[];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: DirectusAlunoImportItem) => Promise<void>;
}

function AlunoImportForm({ candidate, cursos, turnos, coortes, isSubmitting, onCancel, onSubmit }: AlunoImportFormProps) {
  const form = useForm<AlunoFormValues>({
    resolver: zodResolver(alunoFormSchema),
    defaultValues: {
      cursoId: cursos[0]?.id ?? undefined,
      turnoId: undefined,
      coorteId: undefined,
      periodoId: undefined,
      anoIngresso: new Date().getFullYear(),
      situacao: 'ATIVO',
      igreja: candidate.church || candidate.denomination || '',
      createUser: true,
      username: deriveUsername(candidate.email, candidate.name),
      password: generatePassword(),
      pessoa: {
        nome: candidate.name,
        email: candidate.email || '',
        telefone: candidate.cellphone || candidate.phone || '',
        cpf: candidate.cpf || '',
        sexo: candidate.gender || 'O',
        data_nascimento: candidate.birthDate || '',
        endereco: candidate.city ? `${candidate.city}${candidate.state ? ` - ${candidate.state}` : ''}` : '',
      },
    },
  });

  const selectedCursoId = form.watch('cursoId');
  const selectedTurnoId = form.watch('turnoId');

  useEffect(() => {
    const firstCurso = cursos[0];
    if (!form.getValues('cursoId') && firstCurso) {
      form.setValue('cursoId', firstCurso.id);
    }
  }, [cursos, form]);

  useEffect(() => {
    form.resetField('periodoId', { defaultValue: undefined });
  }, [selectedCursoId, form]);

  useEffect(() => {
    form.resetField('coorteId', { defaultValue: undefined });
  }, [selectedCursoId, selectedTurnoId, form]);

  const periodosQuery = useQuery({
    queryKey: ['import', 'periodos', selectedCursoId],
    queryFn: () => apiService.getPeriodos({ cursoId: selectedCursoId!, limit: 100 }),
    enabled: !!selectedCursoId,
  });
  const periodos = periodosQuery.data?.data ?? [];

  const availableCoortes = useMemo(() => {
    if (!selectedCursoId) return [];
    return coortes.filter((coorte) => {
      if (coorte.cursoId !== selectedCursoId) return false;
      if (selectedTurnoId && coorte.turnoId !== selectedTurnoId) return false;
      return true;
    });
  }, [coortes, selectedCursoId, selectedTurnoId]);

  const availableTurnos = useMemo(() => {
    const turnosByCourse = new Set(
      coortes
        .filter((coorte) => coorte.cursoId === selectedCursoId)
        .map((coorte) => coorte.turnoId)
        .filter((turnoId): turnoId is number => typeof turnoId === 'number')
    );
    if (!selectedCursoId) {
      return turnos;
    }
    return turnos.filter((turno) => turnosByCourse.has(turno.id));
  }, [turnos, coortes, selectedCursoId]);

  useEffect(() => {
    const currentTurno = form.getValues('turnoId');
    const firstTurno = availableTurnos[0];
    if (currentTurno && !availableTurnos.some((turno) => turno.id === currentTurno)) {
      form.setValue('turnoId', undefined);
    } else if (!currentTurno && firstTurno) {
      form.setValue('turnoId', firstTurno.id);
    }
  }, [availableTurnos, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const pessoaPayload = {
      nome: values.pessoa.nome,
      email: values.pessoa.email || undefined,
      telefone: values.pessoa.telefone || undefined,
      cpf: values.pessoa.cpf || undefined,
      sexo: values.pessoa.sexo || 'O',
      data_nascimento: values.pessoa.data_nascimento || undefined,
      endereco: values.pessoa.endereco || undefined,
    };

    const payload: DirectusAlunoImportItem = {
      sourceId: candidate.id,
      cursoId: values.cursoId,
      periodoId: values.periodoId,
      turnoId: values.turnoId || undefined,
      coorteId: values.coorteId || undefined,
      anoIngresso: values.anoIngresso,
      situacao: values.situacao,
      igreja: values.igreja || undefined,
      createUser: values.createUser,
      username: values.username || undefined,
      password: values.password || undefined,
      pessoa: pessoaPayload,
    } as DirectusAlunoImportItem;

    await onSubmit(payload);
  });

  return (
    <Card className="mt-6 border-blue-100 shadow-inner">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-blue-600" />
          Preparar importação de {candidate.name}
        </CardTitle>
        <CardDescription>
          Revise os dados abaixo, complete as informações acadêmicas e confirme o cadastro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Curso *</Label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                {...form.register('cursoId', { valueAsNumber: true })}
              >
                <option value="">Selecione...</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                  </option>
                ))}
              </select>
              {form.formState.errors.cursoId && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.cursoId.message}</p>
              )}
            </div>
            <div>
              <Label>Período *</Label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                {...form.register('periodoId', { valueAsNumber: true })}
                disabled={!selectedCursoId || periodosQuery.isLoading}
              >
                <option value="">Selecione...</option>
                {periodos.map((periodo) => (
                  <option key={periodo.id} value={periodo.id}>
                    {periodo.nome || `Período ${periodo.numero}`}
                  </option>
                ))}
              </select>
              {form.formState.errors.periodoId && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.periodoId.message}</p>
              )}
            </div>
            <div>
              <Label>Turno</Label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                {...form.register('turnoId', {
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })}
              >
                <option value="">Flexível</option>
                {availableTurnos.map((turno) => (
                  <option key={turno.id} value={turno.id}>
                    {turno.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Coorte</Label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                {...form.register('coorteId', {
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })}
              >
                <option value="">Sem vínculo</option>
                {availableCoortes.map((coorte) => (
                  <option key={coorte.id} value={coorte.id}>
                    {coorte.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Ano de ingresso *</Label>
              <Input type="number" min={2000} max={2100} {...form.register('anoIngresso', { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Situação *</Label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" {...form.register('situacao')}>
                <option value="ATIVO">Ativo</option>
                <option value="TRANCADO">Trancado</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div>
              <Label>Igreja</Label>
              <Input placeholder="Ex: Igreja Presbiteriana" {...form.register('igreja')} />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <Checkbox id="createUser" checked={form.watch('createUser')} onCheckedChange={(checked) => form.setValue('createUser', Boolean(checked))} />
              <Label htmlFor="createUser" className="font-medium">Gerar usuário de acesso</Label>
            </div>
            {form.watch('createUser') && (
              <>
                <div>
                  <Label>Username *</Label>
                  <Input {...form.register('username')} />
                  {form.formState.errors.username && (
                    <p className="text-xs text-red-600 mt-1">{form.formState.errors.username.message}</p>
                  )}
                </div>
                <div>
                  <Label>Senha provisória *</Label>
                  <Input type="text" {...form.register('password')} />
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-600 mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="border rounded-lg p-4 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Dados pessoais</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nome completo *</Label>
                <Input {...form.register('pessoa.nome')} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...form.register('pessoa.email')} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input {...form.register('pessoa.telefone')} />
              </div>
              <div>
                <Label>CPF</Label>
                <Input {...form.register('pessoa.cpf')} />
              </div>
              <div>
                <Label>Sexo</Label>
                <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" {...form.register('pessoa.sexo')}>
                  <option value="O">Não informado</option>
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
              <div>
                <Label>Data de nascimento</Label>
                <Input type="date" {...form.register('pessoa.data_nascimento')} />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço (texto livre)</Label>
                <Textarea rows={2} {...form.register('pessoa.endereco')} />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              <span className="ml-2">Importar aluno</span>
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface ProfessorImportFormProps {
  candidate: DirectusProfessorCandidate;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: DirectusProfessorImportItem) => Promise<void>;
}

function ProfessorImportForm({ candidate, isSubmitting, onCancel, onSubmit }: ProfessorImportFormProps) {
  const form = useForm<ProfessorFormValues>({
    resolver: zodResolver(professorFormSchema),
    defaultValues: {
      matricula: generateMatricula(),
      dataInicio: new Date().toISOString().slice(0, 10),
      situacao: 'ATIVO',
      createUser: true,
      username: deriveUsername(undefined, candidate.name),
      password: generatePassword(),
      formacaoAcad: candidate.qualifications || '',
      pessoa: {
        nome: candidate.name,
        email: '',
        telefone: '',
        cpf: '',
        sexo: 'O',
        data_nascimento: '',
        endereco: '',
      },
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: DirectusProfessorImportItem = {
      sourceId: candidate.id,
      matricula: values.matricula,
      dataInicio: values.dataInicio,
      situacao: values.situacao,
      formacaoAcad: values.formacaoAcad || undefined,
      createUser: values.createUser,
      username: values.username || undefined,
      password: values.password || undefined,
      pessoa: {
        nome: values.pessoa.nome,
        email: values.pessoa.email || undefined,
        telefone: values.pessoa.telefone || undefined,
        cpf: values.pessoa.cpf || undefined,
        sexo: values.pessoa.sexo || 'O',
        data_nascimento: values.pessoa.data_nascimento || undefined,
        endereco: values.pessoa.endereco || undefined,
      },
    } as DirectusProfessorImportItem;

    await onSubmit(payload);
  });

  return (
    <Card className="mt-6 border-emerald-100 shadow-inner">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-emerald-600" />
          Preparar importação de {candidate.name}
        </CardTitle>
        <CardDescription>Defina matrícula e credenciais para disponibilizar o acesso ao portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Matrícula *</Label>
              <div className="flex gap-2">
                <Input {...form.register('matricula')} />
                <Button type="button" variant="outline" onClick={() => form.setValue('matricula', generateMatricula())}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Data de início *</Label>
              <Input type="date" {...form.register('dataInicio')} />
            </div>
            <div>
              <Label>Formação acadêmica</Label>
              <Input {...form.register('formacaoAcad')} placeholder="Ex: Doutor em Teologia" />
            </div>
            <div>
              <Label>Situação *</Label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" {...form.register('situacao')}>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="createProfessorUser" checked={form.watch('createUser')} onCheckedChange={(checked) => form.setValue('createUser', Boolean(checked))} />
              <Label htmlFor="createProfessorUser" className="font-medium">Gerar usuário de acesso</Label>
            </div>
            {form.watch('createUser') && (
              <>
                <div>
                  <Label>Username *</Label>
                  <Input {...form.register('username')} />
                  {form.formState.errors.username && (
                    <p className="text-xs text-red-200 mt-1">{form.formState.errors.username.message}</p>
                  )}
                </div>
                <div>
                  <Label>Senha provisória *</Label>
                  <Input type="text" {...form.register('password')} />
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-200 mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <section className="border rounded-lg p-4 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Dados pessoais</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nome completo *</Label>
                <Input {...form.register('pessoa.nome')} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...form.register('pessoa.email')} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input {...form.register('pessoa.telefone')} />
              </div>
              <div>
                <Label>CPF</Label>
                <Input {...form.register('pessoa.cpf')} />
              </div>
              <div>
                <Label>Sexo</Label>
                <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" {...form.register('pessoa.sexo')}>
                  <option value="O">Não informado</option>
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
              <div>
                <Label>Data de nascimento</Label>
                <Input type="date" {...form.register('pessoa.data_nascimento')} />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço (texto livre)</Label>
                <Textarea rows={2} {...form.register('pessoa.endereco')} />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              <span className="ml-2">Importar professor</span>
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
