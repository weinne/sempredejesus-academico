import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { usePageHero } from '@/hooks/use-page-hero';
import { apiService } from '@/services/api';
import { Aula, TurmaInscrito, Role, FrequenciaBulkUpsert } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

interface FrequenciaState {
  [key: string]: boolean; // `${aulaId}-${inscricaoId}` -> presente (false = falta)
}

export default function FrequenciaPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);

  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [frequencias, setFrequencias] = useState<FrequenciaState>({});

  // Initialize turmaId from URL params
  useEffect(() => {
    const turmaIdParam = searchParams.get('turmaId');
    if (turmaIdParam) {
      setTurmaId(Number(turmaIdParam));
    }
  }, [searchParams]);

  // Fetch turmas
  const { data: turmasOptions = [] } = useQuery({
    queryKey: ['turmas-options'],
    queryFn: () => apiService.getTurmas({ limit: 1000 }).then((r) => r.data),
  });

  // Fetch inscritos for selected turma
  const { data: inscritos = [], isLoading: loadingInscritos } = useQuery({
    queryKey: ['turma-inscritos', turmaId],
    queryFn: () => apiService.getTurmaInscritos(turmaId as number),
    enabled: typeof turmaId === 'number',
  });

  // Fetch aulas for selected turma
  const { data: aulasResp, isLoading: loadingAulas } = useQuery({
    queryKey: ['aulas-turma', turmaId],
    queryFn: () =>
      apiService.getAulas({
        turmaId: turmaId as number,
        sortBy: 'data',
        sortOrder: 'asc',
      }),
    enabled: typeof turmaId === 'number',
  });
  const aulas = aulasResp?.data || [];

  // Fetch existing frequencias to populate initial state
  const { data: frequenciasExistentes, refetch: refetchFrequencias } = useQuery({
    queryKey: ['frequencias-existentes', turmaId],
    queryFn: async () => {
      if (!aulas || aulas.length === 0) return [];
      
      // Fetch frequencias for each aula
      const promises = aulas.map((aula) => apiService.getEstudantesAula(aula.id));
      const results = await Promise.all(promises);
      
      // Flatten and index by aulaId-inscricaoId
      const indexed: Record<string, boolean> = {};
      results.forEach((estudantes, idx) => {
        const aulaId = aulas[idx].id;
        estudantes.forEach((est) => {
          const key = `${aulaId}-${est.inscricaoId}`;
          indexed[key] = est.presente;
        });
      });
      
      return indexed;
    },
    enabled: typeof turmaId === 'number' && aulas.length > 0,
  });

  // Hydrate state when data loads
  useEffect(() => {
    if (frequenciasExistentes && typeof frequenciasExistentes === 'object' && !Array.isArray(frequenciasExistentes)) {
      setFrequencias(frequenciasExistentes);
    }
  }, [frequenciasExistentes]);

  // Calculate absence count per student
  const aulaCount = aulas.length;
  const absenceCount = useMemo(() => {
    const counts: Record<number, number> = {};
    inscritos.forEach((inscrito) => {
      let absences = 0;
      aulas.forEach((aula) => {
        const key = `${aula.id}-${inscrito.id}`;
        const presente = frequencias[key] !== undefined ? frequencias[key] : true;
        if (!presente) absences++;
      });
      counts[inscrito.id] = absences;
    });
    return counts;
  }, [inscritos, aulas, frequencias]);

  const toggleFrequencia = (aulaId: number, inscricaoId: number) => {
    const key = `${aulaId}-${inscricaoId}`;
    setFrequencias((prev) => ({
      ...prev,
      [key]: prev[key] !== undefined ? !prev[key] : false, // Toggle or mark as absent
    }));
  };

  const saveMutation = useMutation({
    mutationFn: (payload: FrequenciaBulkUpsert) => apiService.bulkUpsertFrequencias(payload),
    onSuccess: () => {
      toast({ title: 'Frequências salvas com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['frequencias-existentes', turmaId] });
      queryClient.invalidateQueries({ queryKey: ['turma-inscritos', turmaId] });
      refetchFrequencias();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar frequências',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!canEdit || typeof turmaId !== 'number') return;

    // Build the payload: only send explicit states (default presente=true is assumed)
    const itens = [];
    for (const inscrito of inscritos) {
      for (const aula of aulas) {
        const key = `${aula.id}-${inscrito.id}`;
        const presente = frequencias[key] !== undefined ? frequencias[key] : true;
        
        // Always send the state for simplicity (backend will upsert)
        itens.push({
          aulaId: aula.id,
          inscricaoId: inscrito.id,
          presente,
          justificativa: null,
        });
      }
    }

    if (itens.length === 0) {
      toast({ title: 'Nenhuma frequência para salvar', variant: 'destructive' });
      return;
    }

    saveMutation.mutate({ itens });
  };

  const isLoading = loadingInscritos || loadingAulas;

  // Configure Hero via hook
  usePageHero({
    title: canEdit ? "Registro de Frequência" : "Frequência",
    description: canEdit ? "Marque as faltas dos alunos por aula" : "Visualize informações de frequência",
    backTo: "/dashboard"
  });

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                Você não tem permissão para registrar frequências.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione a Turma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="turmaId">Turma</Label>
                <select
                  id="turmaId"
                  className="w-full border rounded px-3 py-2"
                  value={typeof turmaId === 'number' ? String(turmaId) : ''}
                  onChange={(e) => setTurmaId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Selecione uma turma</option>
                  {turmasOptions.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.id} - {t.disciplina?.nome || 'Turma'} (
                      {t.professor?.pessoa?.nome || 'Prof. não definido'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid */}
        {typeof turmaId === 'number' && (
          <>
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-gray-500">Carregando...</p>
                </CardContent>
              </Card>
            ) : inscritos.length === 0 || aulas.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-gray-500">
                    {inscritos.length === 0
                      ? 'Nenhum aluno inscrito nesta turma.'
                      : 'Nenhuma aula cadastrada para esta turma.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Grade de Frequência</CardTitle>
                  <CardDescription>
                    Clique nas células para marcar/desmarcar faltas. Total de {aulas.length} aula(s).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left font-medium sticky left-0 bg-gray-100 z-10">
                            Aluno (RA)
                          </th>
                          {aulas.map((aula) => {
                            const date = new Date(aula.data);
                            return (
                              <th
                                key={aula.id}
                                className="border border-gray-300 px-2 py-2 text-center text-xs font-medium min-w-[80px]"
                              >
                                <div>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                                {aula.horaInicio && (
                                  <div className="text-gray-500">{aula.horaInicio}</div>
                                )}
                              </th>
                            );
                          })}
                          <th className="border border-gray-300 px-4 py-2 text-center font-medium bg-yellow-50">
                            Faltas
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {inscritos.map((inscrito) => {
                          const aluno = inscrito.aluno;
                          const nomeCompleto = aluno?.pessoa?.nome || 'Nome não disponível';
                          const ra = aluno?.ra || inscrito.alunoId;
                          const absences = absenceCount[inscrito.id] || 0;
                          
                          return (
                            <tr key={inscrito.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 sticky left-0 bg-white font-medium text-sm">
                                <div>{nomeCompleto}</div>
                                <div className="text-xs text-gray-500">RA: {ra}</div>
                              </td>
                              {aulas.map((aula) => {
                                const key = `${aula.id}-${inscrito.id}`;
                                const presente = frequencias[key] !== undefined ? frequencias[key] : true;
                                const isFalta = !presente;
                                
                                return (
                                  <td
                                    key={aula.id}
                                    className={`border border-gray-300 px-2 py-2 text-center cursor-pointer ${
                                      isFalta ? 'bg-red-100' : 'bg-green-50'
                                    }`}
                                    onClick={() => toggleFrequencia(aula.id, inscrito.id)}
                                  >
                                    {isFalta ? (
                                      <X className="h-5 w-5 text-red-600 mx-auto" />
                                    ) : (
                                      <div className="h-5 w-5 mx-auto" />
                                    )}
                                  </td>
                                );
                              })}
                              <td className="border border-gray-300 px-4 py-2 text-center font-medium bg-yellow-50">
                                {absences}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span className="inline-block w-4 h-4 bg-green-50 border border-gray-300 mr-2"></span>
                      Presente
                      <span className="inline-block w-4 h-4 bg-red-100 border border-gray-300 ml-4 mr-2"></span>
                      Falta
                    </div>
                    <Button onClick={handleSave} disabled={saveMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {saveMutation.isPending ? 'Salvando...' : 'Salvar Frequências'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}

