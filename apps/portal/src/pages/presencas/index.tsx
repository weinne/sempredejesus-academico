import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { usePageHero } from '@/hooks/use-page-hero';
import { apiService } from '@/services/api';
import { Aula, EstudanteAula, LancarFrequenciaInput, Role, AlertasFrequencia } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Save, Calendar, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const normalizeTimeValue = (value?: string | null): string => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const parts = trimmed.split(':');
  if (parts.length < 2) {
    return '';
  }

  const hoursNum = Number(parts[0]);
  const minutesNum = Number(parts[1]);

  if (
    !Number.isFinite(hoursNum) ||
    !Number.isFinite(minutesNum) ||
    hoursNum < 0 ||
    hoursNum > 23 ||
    minutesNum < 0 ||
    minutesNum > 59
  ) {
    return '';
  }

  const hours = hoursNum.toString().padStart(2, '0');
  const minutes = minutesNum.toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function PresencasPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);
  const [searchParams] = useSearchParams();
  const prefilledFromQuery = useRef(false);

  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [aulaId, setAulaId] = useState<number | ''>('');
  const [justificativas, setJustificativas] = useState<Record<number, string>>({});
  const [aulaForm, setAulaForm] = useState<Partial<Aula> | null>(null);

  // Options for selects
  const { data: turmasOptions = [] } = useQuery({
    queryKey: ['turmas-options'],
    queryFn: () => apiService.getTurmas({ limit: 1000 }).then(r => r.data),
  });

  // Aulas for selected turma
  const { data: aulasResp, refetch: refetchAulas } = useQuery({
    queryKey: ['aulas', turmaId],
    queryFn: () => apiService.getAulas({
      turmaId: typeof turmaId === 'number' ? turmaId : undefined,
      sortBy: 'data',
      sortOrder: 'desc',
    }).then(r => r.data),
    enabled: typeof turmaId === 'number',
  });
  const aulas = aulasResp || [];

  // Turma inscritos (fonte confiável dos nomes dos alunos)
  const { data: turmaInscritos = [] } = useQuery({
    queryKey: ['turma-inscritos-presenca', turmaId],
    queryFn: () => apiService.getTurmaInscritos(turmaId as number),
    enabled: typeof turmaId === 'number',
  });

  // Estudantes for selected aula
  const { data: estudantes = [], refetch: refetchEstudantes, isLoading: loadingEstudantes } = useQuery({
    queryKey: ['aula-estudantes', aulaId],
    queryFn: () => apiService.getEstudantesAula(aulaId as number),
    enabled: typeof aulaId === 'number',
  });

// Detalhes da aula selecionada
const { data: aulaDetalhes, refetch: refetchAulaDetalhes, isFetching: loadingAulaDetalhes } = useQuery({
  queryKey: ['aula-detalhes', aulaId],
  queryFn: () => apiService.getAula(aulaId as number),
    enabled: typeof aulaId === 'number',
  });

  // Attendance alerts for selected turma
  const { data: alertasFrequencia } = useQuery({
    queryKey: ['alertas-frequencia', turmaId],
    queryFn: () => apiService.getAlertasFrequencia(turmaId as number),
    enabled: typeof turmaId === 'number',
  });

  const [presencas, setPresencas] = useState<Record<number, boolean>>({});

  const alunoNomePorRa = useMemo(() => {
    const map: Record<string, string> = {};
    turmaInscritos.forEach((inscricao) => {
      const raKey = (inscricao.alunoId || '').trim();
      const pessoa = inscricao.aluno?.pessoa;
      const rawNome = pessoa?.nome ?? pessoa?.nomeCompleto ?? '';
      const nome = typeof rawNome === 'string' ? rawNome.trim() : '';
      if (raKey && nome) {
        map[raKey] = nome;
      }
    });
    return map;
  }, [turmaInscritos]);

  // Initialize presencas when estudantes load
useEffect(() => {
    if (estudantes.length > 0) {
      const initialPresencas: Record<number, boolean> = {};
      const initialJustificativas: Record<number, string> = {};
      
      estudantes.forEach(estudante => {
        initialPresencas[estudante.inscricaoId] = estudante.presente;
        if (estudante.justificativa) {
          initialJustificativas[estudante.inscricaoId] = estudante.justificativa;
        }
      });
      
      setPresencas(initialPresencas);
      setJustificativas(initialJustificativas);
  } else {
    setPresencas({});
    setJustificativas({});
    }
  }, [estudantes]);

useEffect(() => {
  if (aulaDetalhes) {
    setAulaForm({
      data: aulaDetalhes.data ?? '',
      horaInicio: normalizeTimeValue(aulaDetalhes.horaInicio),
      horaFim: normalizeTimeValue(aulaDetalhes.horaFim),
      topico: aulaDetalhes.topico ?? '',
      materialUrl: aulaDetalhes.materialUrl ?? '',
      observacao: aulaDetalhes.observacao ?? '',
    });
  } else if (typeof aulaId !== 'number') {
    setAulaForm(null);
  }
}, [aulaDetalhes, aulaId]);

useEffect(() => {
  if (prefilledFromQuery.current) return;

  const turmaParam = searchParams.get('turmaId');
  const aulaParam = searchParams.get('aulaId');
  let hasPrefill = false;

  if (turmaParam) {
    const parsedTurma = Number(turmaParam);
    if (!Number.isNaN(parsedTurma)) {
      setTurmaId(parsedTurma);
      hasPrefill = true;
    }
  }

  if (aulaParam) {
    const parsedAula = Number(aulaParam);
    if (!Number.isNaN(parsedAula)) {
      setAulaId(parsedAula);
      hasPrefill = true;
    }
  }

  if (hasPrefill) {
    prefilledFromQuery.current = true;
  }
}, [searchParams]);

const salvarRegistroCompleto = useMutation({
  mutationFn: async () => {
    if (typeof aulaId !== 'number') {
      throw new Error('Selecione uma aula para continuar');
    }

    const frequencias: LancarFrequenciaInput[] = estudantes.map(estudante => ({
      inscricaoId: estudante.inscricaoId,
      presente: presencas[estudante.inscricaoId] ?? true,
      justificativa: justificativas[estudante.inscricaoId] || undefined,
    }));

    const requests: Promise<any>[] = [];

    if (aulaForm) {
      const aulaPayload = {
        data: aulaForm.data || undefined,
        horaInicio: normalizeTimeValue(aulaForm.horaInicio) || undefined,
        horaFim: normalizeTimeValue(aulaForm.horaFim) || undefined,
        topico: aulaForm.topico || undefined,
        materialUrl: aulaForm.materialUrl || undefined,
        observacao: aulaForm.observacao || undefined,
      };
      requests.push(apiService.updateAula(aulaId, aulaPayload));
    }

    if (frequencias.length > 0) {
      requests.push(apiService.lancarFrequencias(aulaId, frequencias));
    }

    if (requests.length === 0) {
      throw new Error('Nenhuma informação para salvar');
    }

    await Promise.all(requests);
  },
    onSuccess: () => {
    toast({ title: 'Aula e presenças salvas com sucesso!' });
      refetchEstudantes();
    refetchAulaDetalhes();
    },
    onError: (e: any) => {
      toast({ 
      title: 'Erro ao salvar informações',
      description: e.message || 'Tente novamente em instantes',
      variant: 'destructive',
      });
    },
  });

  const togglePresenca = (inscricaoId: number) => {
    setPresencas(prev => ({
      ...prev,
      [inscricaoId]: !prev[inscricaoId]
    }));
  };

  const setJustificativa = (inscricaoId: number, value: string) => {
    setJustificativas(prev => ({
      ...prev,
      [inscricaoId]: value
    }));
  };

const updateAulaForm = (
  field: keyof Pick<Aula, 'data' | 'horaInicio' | 'horaFim' | 'topico' | 'materialUrl' | 'observacao'>,
  value: string,
) => {
  const sanitizedValue =
    field === 'horaInicio' || field === 'horaFim' ? normalizeTimeValue(value) : value;

  setAulaForm(prev => ({
    ...(prev ?? {}),
    [field]: sanitizedValue,
    }));
  };

  const handleSalvar = () => {
    if (typeof aulaId !== 'number') return;
  salvarRegistroCompleto.mutate();
  };

  const totalEstudantes = estudantes.length;
  const presentes = Object.values(presencas).filter(Boolean).length;
  const ausentes = totalEstudantes - presentes;
  const aulasListPath = typeof turmaId === 'number' ? `/aulas/list?turmaId=${turmaId}` : '/aulas/list';

  const getEstudanteNome = (estudante: EstudanteAula) => {
    const direto = estudante.nomeCompleto?.trim();
    if (direto && direto.length > 0) {
      return direto;
    }

    const possiveisChaves = [estudante.ra, estudante.alunoId]
      .map((valor) => (typeof valor === 'string' ? valor.trim() : ''))
      .filter(Boolean);

    for (const chave of possiveisChaves) {
      const nomeEncontrado = alunoNomePorRa[chave];
      if (nomeEncontrado) {
        return nomeEncontrado;
      }
    }

    return `RA ${estudante.ra}`;
  };

  // Configure Hero via hook
  usePageHero({
  title: "Registro de Aula & Presenças",
  description: "Atualize os dados da aula e marque presenças em uma única tela",
    backTo: aulasListPath
  });

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Seleção de Turma e Aula */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Selecionar Aula
            </CardTitle>
            <CardDescription>
              Escolha a turma e a aula para registrar as presenças
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Turma</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={typeof turmaId === 'number' ? String(turmaId) : ''}
                  onChange={(e) => {
                    setTurmaId(e.target.value ? Number(e.target.value) : '');
                    setAulaId('');
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Aula</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={typeof aulaId === 'number' ? String(aulaId) : ''}
                  onChange={(e) => setAulaId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!turmaId}
                >
                  <option value="">Selecione uma aula</option>
                  {aulas.map(aula => (
                    <option key={aula.id} value={aula.id}>
                      {aula.data} - {aula.topico || 'Sem tópico'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </CardContent>
        </Card>

        {typeof aulaId === 'number' && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Aula</CardTitle>
              <CardDescription>
                Registre conteúdo, horários e observações antes de salvar as presenças
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAulaDetalhes ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Carregando informações da aula...
                </div>
              ) : !aulaForm ? (
                <div className="text-sm text-muted-foreground">
                  Não encontramos informações para esta aula. Tente selecionar outra aula.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data</label>
                      <Input
                        type="date"
                        value={aulaForm.data || ''}
                        onChange={(e) => updateAulaForm('data', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hora Início</label>
                      <Input
                        type="time"
                        value={aulaForm.horaInicio || ''}
                        onChange={(e) => updateAulaForm('horaInicio', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hora Fim</label>
                      <Input
                        type="time"
                        value={aulaForm.horaFim || ''}
                        onChange={(e) => updateAulaForm('horaFim', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tópico da Aula</label>
                      <Input
                        placeholder="Ex.: Introdução à Escatologia"
                        value={aulaForm.topico || ''}
                        onChange={(e) => updateAulaForm('topico', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Material / URL</label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={aulaForm.materialUrl || ''}
                        onChange={(e) => updateAulaForm('materialUrl', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Observações</label>
                    <Textarea
                      rows={4}
                      placeholder="Notas adicionais, tarefas, etc."
                      value={aulaForm.observacao || ''}
                      onChange={(e) => updateAulaForm('observacao', e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attendance Alerts */}
        {alertasFrequencia && alertasFrequencia.alertas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Alertas de Frequência
              </CardTitle>
              <CardDescription>
                Alunos que precisam de atenção quanto à frequência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertasFrequencia.alertas.map((alerta) => (
                  <div 
                    key={alerta.inscricaoId}
                    className={cn(
                      "p-4 rounded-lg border",
                      alerta.nivel === 'critical' 
                        ? "bg-red-50 border-red-200" 
                        : "bg-amber-50 border-amber-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={alerta.nivel === 'critical' ? 'destructive' : 'default'}
                        >
                          {alerta.nivel === 'critical' ? 'CRÍTICO' : 'ATENÇÃO'}
                        </Badge>
                        <span className="font-medium">{alerta.nomeCompleto}</span>
                        <span className="text-sm text-gray-600">RA: {alerta.ra}</span>
                      </div>
                      <div className="text-sm font-mono">
                        {alerta.percentualFaltas.toFixed(1)}% faltas
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm",
                      alerta.nivel === 'critical' ? "text-red-700" : "text-amber-700"
                    )}>
                      {alerta.mensagem}
                    </p>
                    <div className="text-xs text-gray-600 mt-1">
                      {alerta.ausencias} faltas de {alerta.totalAulas} aulas • 
                      Frequência: {alerta.percentualFrequencia.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Estudantes */}
        {typeof aulaId === 'number' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Presenças da Aula
                  </CardTitle>
                  <CardDescription>
                    Clique nos alunos para alternar entre presente (verde) e ausente (vermelho)
                  </CardDescription>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Presentes: {presentes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Ausentes: {ausentes}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEstudantes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando estudantes...</p>
                </div>
              ) : estudantes.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum estudante inscrito nesta turma</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estudantes.map((estudante) => {
                      const isPresente = presencas[estudante.inscricaoId] ?? true;
                      const nomeAluno = getEstudanteNome(estudante);
                      return (
                        <div
                          key={estudante.inscricaoId}
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md",
                            isPresente 
                              ? "border-green-500 bg-green-50 hover:bg-green-100" 
                              : "border-red-500 bg-red-50 hover:bg-red-100"
                          )}
                          onClick={() => togglePresenca(estudante.inscricaoId)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isPresente ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              <Badge variant={isPresente ? "default" : "destructive"}>
                                {isPresente ? "Presente" : "Ausente"}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">
                              {nomeAluno}
                            </p>
                            <p className="text-sm text-gray-600">
                              RA: {estudante.ra}
                            </p>
                          </div>

                          {!isPresente && (
                            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                              <Textarea
                                placeholder="Justificativa (opcional)"
                                value={justificativas[estudante.inscricaoId] || ''}
                                onChange={(e) => setJustificativa(estudante.inscricaoId, e.target.value)}
                                className="text-xs"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {canEdit && (
                    <div className="flex justify-end pt-4 border-t">
                      <Button 
                        onClick={handleSalvar}
                        disabled={salvarRegistroCompleto.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {salvarRegistroCompleto.isPending ? 'Salvando...' : 'Salvar Aula e Presenças'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

