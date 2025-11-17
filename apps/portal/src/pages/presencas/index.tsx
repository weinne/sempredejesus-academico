import React, { useState } from 'react';
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
import { Save, Calendar, Users, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PresencasPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);

  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [aulaId, setAulaId] = useState<number | ''>('');
  const [justificativas, setJustificativas] = useState<Record<number, string>>({});

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

  // Estudantes for selected aula
  const { data: estudantes = [], refetch: refetchEstudantes, isLoading: loadingEstudantes } = useQuery({
    queryKey: ['aula-estudantes', aulaId],
    queryFn: () => apiService.getEstudantesAula(aulaId as number),
    enabled: typeof aulaId === 'number',
  });

  // Attendance alerts for selected turma
  const { data: alertasFrequencia } = useQuery({
    queryKey: ['alertas-frequencia', turmaId],
    queryFn: () => apiService.getAlertasFrequencia(turmaId as number),
    enabled: typeof turmaId === 'number',
  });

  const [presencas, setPresencas] = useState<Record<number, boolean>>({});

  // Initialize presencas when estudantes load
  React.useEffect(() => {
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
    }
  }, [estudantes]);

  const salvarFrequencias = useMutation({
    mutationFn: (frequencias: LancarFrequenciaInput[]) => 
      apiService.lancarFrequencias(aulaId as number, frequencias),
    onSuccess: () => {
      toast({ title: 'Presenças salvas com sucesso!' });
      refetchEstudantes();
    },
    onError: (e: any) => {
      toast({ 
        title: 'Erro ao salvar presenças', 
        description: e.message, 
        variant: 'destructive' 
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

  const handleSalvar = () => {
    if (typeof aulaId !== 'number') return;

    const frequencias: LancarFrequenciaInput[] = estudantes.map(estudante => ({
      inscricaoId: estudante.inscricaoId,
      presente: presencas[estudante.inscricaoId] ?? true,
      justificativa: justificativas[estudante.inscricaoId] || undefined,
    }));

    salvarFrequencias.mutate(frequencias);
  };

  const aulasSelecionada = aulas.find(a => a.id === aulaId);
  const totalEstudantes = estudantes.length;
  const presentes = Object.values(presencas).filter(Boolean).length;
  const ausentes = totalEstudantes - presentes;

  // Configure Hero via hook
  usePageHero({
    title: "Registro de Presenças",
    description: "Marque as presenças dos alunos de forma visual e intuitiva",
    backTo: "/dashboard"
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

            {aulasSelecionada && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Aula Selecionada</h4>
                <p className="text-blue-700">
                  <strong>Data:</strong> {aulasSelecionada.data}
                  {aulasSelecionada.topico && (
                    <> | <strong>Tópico:</strong> {aulasSelecionada.topico}</>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
                              {estudante.nomeCompleto}
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
                        disabled={salvarFrequencias.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {salvarFrequencias.isPending ? 'Salvando...' : 'Salvar Presenças'}
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

