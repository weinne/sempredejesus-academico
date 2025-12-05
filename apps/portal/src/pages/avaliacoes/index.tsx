import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiService } from '@/services/api';
import { Avaliacao, CreateAvaliacao, LancarNotaInput, Role, EstudanteAvaliacao, ValidacaoPesos } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Plus, List, Calendar, AlertTriangle, CheckCircle, Save, Download, Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { usePageHero } from '@/hooks/use-page-hero';
import { GradeUtils } from '@/lib/grade-utils';
import { cn } from '@/lib/utils';

export default function AvaliacoesPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

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
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize turmaId from URL params
  useEffect(() => {
    const turmaIdParam = searchParams.get('turmaId');
    if (turmaIdParam) {
      setTurmaId(Number(turmaIdParam));
    }
  }, [searchParams]);

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
      setShowNewForm(false);
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

  // Configure Hero via hook
  usePageHero({
    title: "Sistema de Notas e Avaliações",
    description: "Gerencie avaliações, lance notas e acompanhe o desempenho dos alunos",
    backTo: "/dashboard"
  });

  return (
    <div className="min-h-screen bg-gray-50">

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
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Avaliações Cadastradas</h3>
                    {canEdit && (
                      <Button 
                        onClick={() => setShowNewForm(!showNewForm)}
                        variant={showNewForm ? "secondary" : "default"}
                        className="flex items-center gap-2"
                      >
                        {showNewForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showNewForm ? 'Cancelar' : 'Nova Avaliação'}
                      </Button>
                    )}
                  </div>

                  {showNewForm && (
                    <div className="bg-gray-50 p-4 rounded-lg border animate-in slide-in-from-top-2">
                      <h4 className="font-medium mb-4">Preencha os dados da nova avaliação</h4>
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
                          <DatePicker 
                            value={novo.data || null} 
                            onChange={(value) => setNovo(v => ({...v, data: value || ''}))}
                            placeholder="dd/mm/aaaa"
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
                  )}

                  <div>
                    {avaliacoes.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                        <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma avaliação cadastrada</h3>
                        <p className="text-gray-500">Comece criando uma nova avaliação para esta turma.</p>
                        {canEdit && (
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => setShowNewForm(true)}
                          >
                            Criar Avaliação
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {avaliacoes.map((avaliacao) => (
                          <Card 
                            key={avaliacao.id}
                            className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
                            onClick={() => {
                              setAvaliacaoSelecionada(avaliacao.id);
                              setActiveTab('lancamento');
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="font-mono">{avaliacao.codigo}</Badge>
                                    <Badge variant="outline">{avaliacao.tipo}</Badge>
                                  </div>
                                  <h4 className="font-semibold text-lg">{avaliacao.descricao}</h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-2xl font-bold text-blue-600">{avaliacao.peso}%</span>
                                  <p className="text-xs text-gray-500">do total</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {avaliacao.data}
                                </div>
                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                  Lançar Notas <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Lançamento Tab */}
                <TabsContent value="lancamento" className="space-y-6">
                  {!avaliacaoSelecionada ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                      <List className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">Nenhuma avaliação selecionada</h3>
                      <p className="text-gray-500 mb-4">Selecione uma avaliação na aba "Avaliações" para lançar notas.</p>
                      <Button variant="outline" onClick={() => setActiveTab('avaliacoes')}>
                        Voltar para Avaliações
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 rounded-full" 
                              onClick={() => setActiveTab('avaliacoes')}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h3 className="text-lg font-semibold">
                              {avaliacaoAtual?.codigo} - {avaliacaoAtual?.descricao}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 ml-8">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {avaliacaoAtual?.data}</span>
                            <span className="flex items-center gap-1"><Badge variant="outline" className="text-xs">{avaliacaoAtual?.tipo}</Badge></span>
                            <span className="font-medium text-blue-600">Peso: {avaliacaoAtual?.peso}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="Buscar aluno..."
                              className="pl-9 w-[200px] md:w-[300px]"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
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
                      </div>

                      {/* Stats Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-blue-50 border-blue-100">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-600">Total de Alunos</p>
                              <h4 className="text-2xl font-bold text-blue-900">{estudantesAvaliacao.length}</h4>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <List className="h-4 w-4 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-100">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-600">Média da Turma</p>
                              <h4 className="text-2xl font-bold text-green-900">
                                {estudantesAvaliacao.length > 0 
                                  ? (estudantesAvaliacao.reduce((acc, curr) => acc + (curr.nota || 0), 0) / (estudantesAvaliacao.filter(e => e.nota !== null).length || 1)).toFixed(1)
                                  : '-'
                                }
                              </h4>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-purple-50 border-purple-100">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-600">Notas Lançadas</p>
                              <h4 className="text-2xl font-bold text-purple-900">
                                {estudantesAvaliacao.filter(e => e.nota !== null).length} / {estudantesAvaliacao.length}
                              </h4>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Save className="h-4 w-4 text-purple-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Spreadsheet Interface */}
                      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50 border-b">
                          <div className="grid grid-cols-12 gap-4 p-3 font-medium text-sm text-gray-600">
                            <div className="col-span-2 md:col-span-1">RA</div>
                            <div className="col-span-5 md:col-span-4">Nome</div>
                            <div className="col-span-2">Nota (0-10)</div>
                            <div className="col-span-3 md:col-span-3">Observações</div>
                            <div className="col-span-2 hidden md:block">Média Geral</div>
                          </div>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                          {estudantesAvaliacao
                            .filter(estudante => 
                              estudante.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              estudante.ra.includes(searchTerm)
                            )
                            .map((estudante) => (
                            <div key={estudante.alunoId} className="grid grid-cols-12 gap-4 p-3 border-b hover:bg-gray-50 items-center transition-colors">
                              <div className="col-span-2 md:col-span-1 text-sm font-mono text-gray-500">
                                {estudante.ra}
                              </div>
                              <div className="col-span-5 md:col-span-4 text-sm font-medium">
                                {estudante.nomeCompleto}
                              </div>
                              <div className="col-span-2">
                                <Input
                                  placeholder="-"
                                  value={notasEditadas[estudante.alunoId]?.nota || ''}
                                  onChange={(e) => updateGrade(estudante.alunoId, 'nota', e.target.value)}
                                  disabled={!canEdit}
                                  className={cn(
                                    "text-center font-medium h-9",
                                    notasEditadas[estudante.alunoId]?.nota && 
                                    GradeUtils.getGradeColorClass(
                                      GradeUtils.parseGradeFromDisplay(notasEditadas[estudante.alunoId].nota)
                                    )
                                  )}
                                />
                              </div>
                              <div className="col-span-3 md:col-span-3">
                                <Input
                                  placeholder="Observações..."
                                  value={notasEditadas[estudante.alunoId]?.obs || ''}
                                  onChange={(e) => updateGrade(estudante.alunoId, 'obs', e.target.value)}
                                  disabled={!canEdit}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="col-span-2 hidden md:flex items-center text-sm">
                                <Badge variant="outline" className={cn(
                                  "font-mono",
                                  estudante.media >= 7 ? "border-green-200 bg-green-50 text-green-700" : 
                                  estudante.media >= 5 ? "border-yellow-200 bg-yellow-50 text-yellow-700" : 
                                  "border-red-200 bg-red-50 text-red-700"
                                )}>
                                  {GradeUtils.formatGradeForDisplay(estudante.media)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          
                          {estudantesAvaliacao.filter(estudante => 
                              estudante.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              estudante.ra.includes(searchTerm)
                            ).length === 0 && (
                            <div className="text-center py-12">
                              <p className="text-muted-foreground">Nenhum estudante encontrado com este filtro</p>
                            </div>
                          )}
                        </div>
                      </div>
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