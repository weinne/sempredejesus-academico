import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiService } from '@/services/api';
import { Avaliacao, CreateAvaliacao, LancarNotaInput, Role, EstudanteAvaliacao, ValidacaoPesos } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Plus, List, Calendar, AlertTriangle, CheckCircle, Save, Download } from 'lucide-react';
import CrudHeader from '@/components/crud/crud-header';
import { GradeUtils } from '@/lib/grade-utils';
import { cn } from '@/lib/utils';

export default function AvaliacoesPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);
  const queryClient = useQueryClient();

  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState('avaliacoes');
  const [novo, setNovo] = useState<Partial<CreateAvaliacao>>({ 
    data: '', 
    tipo: 'PROVA', 
    peso: 0,
    codigo: '',
    descricao: ''
  });
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<number | null>(null);
  const [notasEditadas, setNotasEditadas] = useState<Record<string, { nota: string; obs: string }>>({});

  // Query for turmas
  const { data: turmasOptions = [] } = useQuery({
    queryKey: ['turmas-options'],
    queryFn: () => apiService.getTurmas({ limit: 1000 }).then(r => r.data),
  });

  // Query for avaliacoes
  const { data: avaliacoes = [], refetch: refetchAvaliacoes } = useQuery({
    queryKey: ['avaliacoes', turmaId],
    queryFn: () => apiService.getAvaliacoes({
      turmaId: typeof turmaId === 'number' ? turmaId : undefined,
      sortBy: 'data',
      sortOrder: 'desc',
    }).then(r => r.data),
    enabled: typeof turmaId === 'number',
  });

  // Query for weight validation
  const { data: validacaoPesos } = useQuery({
    queryKey: ['validacao-pesos', turmaId],
    queryFn: () => apiService.validarPesosAvaliacao(turmaId as number),
    enabled: typeof turmaId === 'number',
  });

  // Query for students in selected evaluation
  const { data: estudantesAvaliacao = [], refetch: refetchEstudantes } = useQuery({
    queryKey: ['estudantes-avaliacao', avaliacaoSelecionada],
    queryFn: () => apiService.getEstudantesAvaliacao(avaliacaoSelecionada as number),
    enabled: typeof avaliacaoSelecionada === 'number',
  });

  // Initialize edited grades when students load
  useEffect(() => {
    if (estudantesAvaliacao.length > 0) {
      const initialGrades: Record<string, { nota: string; obs: string }> = {};
      estudantesAvaliacao.forEach(estudante => {
        initialGrades[estudante.alunoId] = {
          nota: estudante.nota !== null ? GradeUtils.formatGradeForDisplay(estudante.nota) : '',
          obs: estudante.obs || ''
        };
      });
      setNotasEditadas(initialGrades);
    }
  }, [estudantesAvaliacao]);

  // Mutations
  const criarAvaliacao = useMutation({
    mutationFn: (payload: CreateAvaliacao) => apiService.createAvaliacao(payload),
    onSuccess: () => {
      toast({ title: 'Avaliação criada com sucesso!' });
      refetchAvaliacoes();
      queryClient.invalidateQueries({ queryKey: ['validacao-pesos', turmaId] });
      setNovo({ data: '', tipo: 'PROVA', peso: 0, codigo: '', descricao: '' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao criar avaliação', description: e.message, variant: 'destructive' });
    },
  });

  const lancarNotas = useMutation({
    mutationFn: ({ avaliacaoId, notas }: { avaliacaoId: number; notas: LancarNotaInput[] }) => 
      apiService.lancarNotas(avaliacaoId, notas),
    onSuccess: () => {
      toast({ title: 'Notas lançadas com sucesso!' });
      refetchEstudantes();
      queryClient.invalidateQueries({ queryKey: ['avaliacoes', turmaId] });
    },
    onError: (e: any) => {
      toast({ 
        title: 'Erro ao lançar notas', 
        description: e.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleCreateAvaliacao = () => {
    if (!canEdit || typeof turmaId !== 'number') return;
    
    if (!novo.codigo || !novo.descricao || !novo.data || !novo.peso) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const payload: CreateAvaliacao = {
      turmaId,
      data: novo.data,
      tipo: novo.tipo || 'PROVA',
      codigo: novo.codigo,
      descricao: novo.descricao,
      peso: novo.peso,
      arquivoUrl: novo.arquivoUrl || undefined,
    };

    criarAvaliacao.mutate(payload);
  };

  const handleSaveGrades = () => {
    if (!avaliacaoSelecionada) return;

    const notas: LancarNotaInput[] = [];
    
    for (const [alunoId, editedGrade] of Object.entries(notasEditadas)) {
      const nota = GradeUtils.parseGradeFromDisplay(editedGrade.nota);
      if (nota !== null) {
        if (!GradeUtils.validateGrade(nota)) {
          toast({ 
            title: 'Nota inválida', 
            description: `A nota ${editedGrade.nota} está fora do intervalo 0-10`, 
            variant: 'destructive' 
          });
          return;
        }
        notas.push({
          alunoId,
          nota,
          obs: editedGrade.obs || undefined
        });
      }
    }

    if (notas.length === 0) {
      toast({ title: 'Nenhuma nota válida para salvar', variant: 'destructive' });
      return;
    }

    lancarNotas.mutate({ avaliacaoId: avaliacaoSelecionada, notas });
  };

  const updateGrade = (alunoId: string, field: 'nota' | 'obs', value: string) => {
    setNotasEditadas(prev => ({
      ...prev,
      [alunoId]: {
        ...prev[alunoId],
        [field]: value
      }
    }));
  };

  const turmasSelecionada = turmasOptions.find((t: any) => t.id === turmaId);
  const avaliacaoAtual = avaliacoes.find(a => a.id === avaliacaoSelecionada);

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader 
        title="Sistema de Notas e Avaliações" 
        description="Gerencie avaliações, lance notas e acompanhe o desempenho dos alunos" 
        backTo="/dashboard" 
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Seleção de Turma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Selecionar Turma
            </CardTitle>
            <CardDescription>
              Escolha a turma para gerenciar avaliações e notas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="max-w-md">
                <label className="text-sm font-medium block mb-2">Turma</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={typeof turmaId === 'number' ? String(turmaId) : ''}
                  onChange={(e) => {
                    setTurmaId(e.target.value ? Number(e.target.value) : '');
                    setAvaliacaoSelecionada(null);
                    setActiveTab('avaliacoes');
                  }}
                >
                  <option value="">Selecione uma turma</option>
                  {turmasOptions.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.id} - {t.disciplina?.nome || 'Turma'}
                    </option>
                  ))}
                </select>
              </div>

              {turmasSelecionada && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Turma Selecionada</h4>
                  <p className="text-blue-700">
                    <strong>Disciplina:</strong> {turmasSelecionada.disciplina?.nome}
                    {turmasSelecionada.professor && (
                      <> | <strong>Professor:</strong> {turmasSelecionada.professor.pessoa?.nome}</>
                    )}
                  </p>
                </div>
              )}

              {/* Weight Validation Alert */}
              {validacaoPesos && (
                <div className={cn(
                  "p-4 rounded-lg border",
                  validacaoPesos.isValid 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center gap-2">
                    {validacaoPesos.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={cn(
                      "font-medium",
                      validacaoPesos.isValid ? "text-green-900" : "text-red-900"
                    )}>
                      Validação de Pesos: {validacaoPesos.message}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs Interface */}
        {typeof turmaId === 'number' && (
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
                  <TabsTrigger value="lancamento">Lançamento</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>

                {/* Avaliações Tab */}
                <TabsContent value="avaliacoes" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Criar Nova Avaliação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-1">Código*</label>
                        <Input 
                          placeholder="Ex: P1, T1"
                          value={novo.codigo || ''}
                          onChange={(e) => setNovo(v => ({...v, codigo: e.target.value}))}
                          maxLength={8}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Descrição*</label>
                        <Input 
                          placeholder="Ex: Primeira Prova"
                          value={novo.descricao || ''}
                          onChange={(e) => setNovo(v => ({...v, descricao: e.target.value}))}
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Data*</label>
                        <Input 
                          type="date" 
                          value={novo.data || ''} 
                          onChange={(e) => setNovo(v => ({...v, data: e.target.value}))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Tipo</label>
                        <select 
                          className="w-full border rounded-md px-3 py-2"
                          value={novo.tipo || 'PROVA'}
                          onChange={(e) => setNovo(v => ({...v, tipo: e.target.value as any}))}
                        >
                          <option value="PROVA">Prova</option>
                          <option value="TRABALHO">Trabalho</option>
                          <option value="PARTICIPACAO">Participação</option>
                          <option value="OUTRO">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Peso (%)*</label>
                        <Input 
                          type="number" 
                          min="1" 
                          max="100"
                          placeholder="Ex: 40"
                          value={novo.peso || ''} 
                          onChange={(e) => setNovo(v => ({...v, peso: Number(e.target.value) || 0}))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">URL do Material</label>
                        <Input 
                          placeholder="https://..."
                          value={novo.arquivoUrl || ''}
                          onChange={(e) => setNovo(v => ({...v, arquivoUrl: e.target.value}))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button 
                        onClick={handleCreateAvaliacao}
                        disabled={!canEdit || criarAvaliacao.isPending}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {criarAvaliacao.isPending ? 'Criando...' : 'Criar Avaliação'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Avaliações Cadastradas</h3>
                    {avaliacoes.length === 0 ? (
                      <p className="text-muted-foreground">Nenhuma avaliação cadastrada</p>
                    ) : (
                      <div className="space-y-2">
                        {avaliacoes.map((avaliacao) => (
                          <div 
                            key={avaliacao.id}
                            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setAvaliacaoSelecionada(avaliacao.id);
                              setActiveTab('lancamento');
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{avaliacao.codigo}</Badge>
                                  <span className="font-medium">{avaliacao.descricao}</span>
                                  <span className="text-sm text-gray-600">({avaliacao.peso}%)</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {avaliacao.data} • {avaliacao.tipo}
                                </p>
                              </div>
                              <Button variant="outline" size="sm">
                                Lançar Notas
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Lançamento Tab */}
                <TabsContent value="lancamento" className="space-y-6">
                  {!avaliacaoSelecionada ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Selecione uma avaliação na aba "Avaliações" para lançar notas
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Lançamento de Notas - {avaliacaoAtual?.codigo} {avaliacaoAtual?.descricao}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Peso: {avaliacaoAtual?.peso}% • Data: {avaliacaoAtual?.data}
                          </p>
                        </div>
                        {canEdit && (
                          <Button 
                            onClick={handleSaveGrades}
                            disabled={lancarNotas.isPending}
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {lancarNotas.isPending ? 'Salvando...' : 'Salvar Notas'}
                          </Button>
                        )}
                      </div>

                      {/* Spreadsheet Interface */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 border-b">
                          <div className="grid grid-cols-12 gap-4 p-3 font-medium text-sm">
                            <div className="col-span-1">RA</div>
                            <div className="col-span-4">Nome</div>
                            <div className="col-span-2">Nota (0-10)</div>
                            <div className="col-span-3">Observações</div>
                            <div className="col-span-2">Média Atual</div>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {estudantesAvaliacao.map((estudante) => (
                            <div key={estudante.alunoId} className="grid grid-cols-12 gap-4 p-3 border-b hover:bg-gray-50">
                              <div className="col-span-1 text-sm font-mono">
                                {estudante.ra}
                              </div>
                              <div className="col-span-4 text-sm">
                                {estudante.nomeCompleto}
                              </div>
                              <div className="col-span-2">
                                <Input
                                  size="sm"
                                  placeholder="0,0"
                                  value={notasEditadas[estudante.alunoId]?.nota || ''}
                                  onChange={(e) => updateGrade(estudante.alunoId, 'nota', e.target.value)}
                                  disabled={!canEdit}
                                  className={cn(
                                    "text-center",
                                    notasEditadas[estudante.alunoId]?.nota && 
                                    GradeUtils.getGradeColorClass(
                                      GradeUtils.parseGradeFromDisplay(notasEditadas[estudante.alunoId].nota)
                                    )
                                  )}
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  size="sm"
                                  placeholder="Observações..."
                                  value={notasEditadas[estudante.alunoId]?.obs || ''}
                                  onChange={(e) => updateGrade(estudante.alunoId, 'obs', e.target.value)}
                                  disabled={!canEdit}
                                />
                              </div>
                              <div className="col-span-2 text-sm flex items-center">
                                <span className={GradeUtils.getGradeColorClass(estudante.media)}>
                                  {GradeUtils.formatGradeForDisplay(estudante.media)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {estudantesAvaliacao.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Nenhum estudante encontrado nesta turma</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Histórico Tab */}
                <TabsContent value="historico">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Funcionalidade de histórico será implementada em breve
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
  });
  const avaliacoes = avalResp || [];

  const clearFilters = () => {
    setTurmaId('');
    setDisciplinaId('');
    setProfessorId('');
    setSearch('');
    refetch();
  };

  const criar = useMutation({
    mutationFn: (payload: CreateAvaliacao) => apiService.createAvaliacao(payload),
    onSuccess: () => { toast({ title: 'Avaliação criada' }); refetch(); },
    onError: (e: any) => toast({ title: 'Erro ao criar', description: e.message, variant: 'destructive' })
  });

  const lancar = useMutation({
    mutationFn: ({ avaliacaoId, notas }: { avaliacaoId: number; notas: LancarNotaInput[] }) => apiService.lancarNotas(avaliacaoId, notas),
    onSuccess: () => { toast({ title: 'Notas lançadas' }); setNotasText(''); },
    onError: (e: any) => toast({ title: 'Erro ao lançar notas', description: e.message, variant: 'destructive' })
  });

  const parseNotas = (text: string): LancarNotaInput[] => {
    // formato por linha: RA;nota;obs?
    return text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const [alunoId, notaStr, obs] = l.split(/[,;\t]/).map(s => s.trim());
        return { alunoId, nota: Number(notaStr), obs } as LancarNotaInput;
      })
      .filter(n => n.alunoId && !Number.isNaN(n.nota));
  };

  const handleCreate = () => {
    if (!canEdit || typeof turmaId !== 'number') return;
    const payload: CreateAvaliacao = {
      turmaId,
      data: String(novo.data || ''),
      tipo: (novo.tipo || 'PROVA') as any,
      codigo: String(novo.codigo || '').slice(0, 8),
      descricao: String(novo.descricao || '').slice(0, 50),
      peso: Number(novo.peso || 10),
      arquivoUrl: (novo as any).arquivoUrl || undefined,
    };
    criar.mutate(payload);
  };

  const handleLancarNotas = () => {
    if (!avaliacaoSelecionada) return;
    const notas = parseNotas(notasText);
    if (notas.length === 0) {
      toast({ title: 'Informe as notas', variant: 'destructive' });
      return;
    }
    lancar.mutate({ avaliacaoId: avaliacaoSelecionada, notas });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Avaliações" description="Gerencie avaliações e lançamento de notas" backTo="/dashboard" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Avaliações Cadastradas</CardTitle>
            <CardDescription>Listagem de avaliações cadastradas</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Turma</label>
              <select
                className="border rounded px-2 py-2 w-56"
                aria-label="Turma"
                value={typeof turmaId === 'number' ? String(turmaId) : ''}
                onChange={(e) => setTurmaId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Todas as turmas</option>
                {turmasOptions.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.id} - {(t.disciplina?.nome) || 'Turma'}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Disciplina</label>
              <select
                className="border rounded px-2 py-2 w-56"
                aria-label="Disciplina"
                value={typeof disciplinaId === 'number' ? String(disciplinaId) : ''}
                onChange={(e) => setDisciplinaId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Todas as disciplinas</option>
                {disciplinasOptions.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.codigo ? `${d.codigo} - ${d.nome}` : d.nome}</option>
                ))}
              </select>
            </div>

            {(hasRole(Role.ADMIN) || hasRole(Role.SECRETARIA)) && (
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Professor</label>
                <select
                  className="border rounded px-2 py-2 w-64"
                  aria-label="Professor"
                  value={professorId || ''}
                  onChange={(e) => setProfessorId(e.target.value)}
                >
                  <option value="">Todos os professores</option>
                  {professoresOptions.map((p: any) => (
                    <option key={p.matricula} value={p.matricula}>{p.pessoa?.nome || p.matricula}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Buscar</label>
              <Input placeholder="Código/descrição" value={search} onChange={(e)=>setSearch(e.target.value)} className="w-64" />
            </div>

            <div className="ml-auto flex items-end gap-2">
              <Button onClick={() => refetch()} disabled={isFetching}><List className="h-4 w-4 mr-2"/>Buscar</Button>
              <Button onClick={clearFilters}>Limpar filtros</Button>
            </div>
          </CardContent>
        </Card>

        {typeof turmaId === 'number' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nova Avaliação</CardTitle>
                <CardDescription>Criar avaliação para a turma {turmaId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={novo.data as string || ''} onChange={e=>setNovo(v=>({...v, data: e.target.value}))}/>
                  <select className="border rounded px-2 py-2" value={novo.tipo as string || 'PROVA'} onChange={e=>setNovo(v=>({...v, tipo: e.target.value as any}))}>
                    <option value="PROVA">PROVA</option>
                    <option value="TRABALHO">TRABALHO</option>
                    <option value="PARTICIPACAO">PARTICIPACAO</option>
                    <option value="OUTRO">OUTRO</option>
                  </select>
                  <Input placeholder="Código (ex: P1)" value={novo.codigo || ''} onChange={e=>setNovo(v=>({...v, codigo: e.target.value}))}/>
                  <Input placeholder="Peso (ex: 30)" type="number" value={Number(novo.peso)||0} onChange={e=>setNovo(v=>({...v, peso: Number(e.target.value)}))}/>
                </div>
                <Input placeholder="Descrição" value={novo.descricao || ''} onChange={e=>setNovo(v=>({...v, descricao: e.target.value}))}/>
                <div className="flex justify-end"><Button disabled={!canEdit} onClick={handleCreate}><Plus className="h-4 w-4 mr-2"/>Criar</Button></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lançar Notas</CardTitle>
                <CardDescription>Selecione a avaliação e cole RA;nota;obs por linha</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <select className="border rounded px-2 py-2 w-full" value={avaliacaoSelecionada ?? ''} onChange={e=>setAvaliacaoSelecionada(e.target.value? Number(e.target.value): null)}>
                  <option value="">Selecione a avaliação</option>
                  {avaliacoes.map(a=> (
                    <option key={a.id} value={a.id}>{a.codigo} - {a.descricao} ({a.data})</option>
                  ))}
                </select>
                <textarea className="w-full h-40 border rounded p-2" placeholder="20240001;8.5;Excelente\n20240002;7.0" value={notasText} onChange={e=>setNotasText(e.target.value)} />
                <div className="flex justify-end"><Button disabled={!avaliacaoSelecionada} onClick={handleLancarNotas}><Send className="h-4 w-4 mr-2"/>Lançar</Button></div>
              </CardContent>
            </Card>
          </div>
        )}

        {typeof turmaId === 'number' && (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Avaliações</CardTitle>
              <CardDescription>{avaliacoes.length} itens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Data</th>
                      <th className="py-2 pr-4">Código</th>
                      <th className="py-2 pr-4">Descrição</th>
                      <th className="py-2 pr-4">Tipo</th>
                      <th className="py-2 pr-4">Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {avaliacoes.map(a => (
                      <tr key={a.id} className="border-b">
                        <td className="py-2 pr-4">{a.data}</td>
                        <td className="py-2 pr-4">{a.codigo}</td>
                        <td className="py-2 pr-4">{a.descricao}</td>
                        <td className="py-2 pr-4">{a.tipo}</td>
                        <td className="py-2 pr-4">{a.peso}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

