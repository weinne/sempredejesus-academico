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