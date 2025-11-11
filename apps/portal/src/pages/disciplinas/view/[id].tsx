import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiService } from '@/services/api';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard } from '@/components/ui/stats-card';
import { Edit, BookOpen, Clock, Award, CheckCircle, XCircle, Hash, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DisciplinaViewPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const {
    data: disciplina,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['disciplina', id],
    queryFn: () => apiService.getDisciplina(Number(id)),
    enabled: !!id,
  });

  const cursoId = disciplina?.cursoId;
  const { data: periodosCurso } = useQuery({
    queryKey: ['periodos', 'disciplina', cursoId],
    queryFn: () => apiService.getPeriodos({ cursoId: cursoId!, limit: 200 }),
    enabled: Boolean(cursoId),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !disciplina) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  const periodosDisponiveis = periodosCurso?.data || [];
  const vinculos = Array.isArray(disciplina.periodos) ? disciplina.periodos : [];
  const vinculoIds = new Set(vinculos.map((vinculo) => Number(vinculo.periodoId)));
  const periodosParaAdicionar = periodosDisponiveis.filter((periodo) => !vinculoIds.has(periodo.id));

  const [selectedPeriodoId, setSelectedPeriodoId] = React.useState<number | ''>('');
  const [novaOrdem, setNovaOrdem] = React.useState('');
  const [novaObrigatoria, setNovaObrigatoria] = React.useState(true);

  React.useEffect(() => {
    if (periodosParaAdicionar.length === 0) {
      setSelectedPeriodoId('');
      return;
    }
    if (selectedPeriodoId === '') {
      setSelectedPeriodoId(periodosParaAdicionar[0].id);
    } else if (!periodosParaAdicionar.some((periodo) => periodo.id === selectedPeriodoId)) {
      setSelectedPeriodoId(periodosParaAdicionar[0].id);
    }
  }, [periodosParaAdicionar, selectedPeriodoId]);

  const addRelationMutation = useMutation({
    mutationFn: async ({ periodoId, ordem, obrigatoria }: { periodoId: number; ordem?: number; obrigatoria: boolean }) => {
      await apiService.addDisciplinaAoPeriodo(periodoId, {
        disciplinaId: disciplina.id,
        ordem,
        obrigatoria,
      });
    },
    onSuccess: () => {
      toast({ title: 'Vínculo criado', description: 'Disciplina vinculada ao período com sucesso.' });
      setSelectedPeriodoId('');
      setNovaOrdem('');
      setNovaObrigatoria(true);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Não foi possível criar o vínculo',
        description: error?.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const removeRelationMutation = useMutation({
    mutationFn: (periodoId: number) => apiService.removeDisciplinaDoPeriodo(periodoId, disciplina.id),
    onSuccess: () => {
      toast({ title: 'Vínculo removido', description: 'Disciplina desvinculada do período.' });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Não foi possível remover o vínculo',
        description: error?.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const updateRelationMutation = useMutation({
    mutationFn: ({ periodoId, data }: { periodoId: number; data: { ordem?: number; obrigatoria?: boolean } }) =>
      apiService.updateDisciplinaPeriodo(periodoId, disciplina.id, data),
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Não foi possível atualizar o vínculo',
        description: error?.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const handleAddVinculo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof selectedPeriodoId !== 'number') {
      return;
    }
    const parsed = Number(novaOrdem);
    const ordem = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
    addRelationMutation.mutate({ periodoId: selectedPeriodoId, ordem, obrigatoria: novaObrigatoria });
  };

  const handleToggleObrigatoria = (periodoId: number, obrigatoriaAtual: boolean) => {
    updateRelationMutation.mutate({ periodoId, data: { obrigatoria: !obrigatoriaAtual } });
  };

  const handleUpdateOrdem = (periodoId: number, rawValue: string, ordemAtual?: number | null) => {
    const parsed = Number(rawValue);
    const ordem = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
    const normalizadoAtual = ordemAtual ?? undefined;
    if (ordem === normalizadoAtual) {
      return;
    }
    updateRelationMutation.mutate({ periodoId, data: { ordem } });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/disciplinas">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar às Disciplinas
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <Badge variant={disciplina.ativo ? "default" : "secondary"}>
                    {disciplina.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <h1 className="text-2xl font-bold text-gray-900">{disciplina.nome}</h1>
                </div>
                <p className="text-sm text-gray-600">Código: {disciplina.codigo}</p>
              </div>
            </div>
            <Link to={`/disciplinas/edit/${disciplina.id}`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar Disciplina
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        badge="Detalhes da Disciplina"
        title={disciplina.nome}
        description={`Disciplina ${disciplina.ativo ? 'ativa' : 'inativa'} com ${disciplina.creditos} créditos e ${disciplina.cargaHoraria}h de carga horária`}
        stats={[
          { value: disciplina.codigo, label: 'Código' },
          { value: disciplina.creditos, label: 'Créditos' },
          { value: `${disciplina.cargaHoraria}h`, label: 'Carga Horária' },
          { value: disciplina.ativo ? 'Ativa' : 'Inativa', label: 'Status' }
        ]}
        actionLink={{
          href: '/disciplinas',
          label: 'Ver todas as disciplinas'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard
            title="Código"
            value={disciplina.codigo}
            icon={Hash}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Créditos"
            value={disciplina.creditos}
            icon={Award}
            iconColor="text-green-600"
          />
          <StatCard
            title="Carga Horária"
            value={`${disciplina.cargaHoraria}h`}
            icon={Clock}
            iconColor="text-purple-600"
          />
          <StatCard
            title="Status"
            value={disciplina.ativo ? 'Ativa' : 'Inativa'}
            icon={disciplina.ativo ? CheckCircle : XCircle}
            iconColor={disciplina.ativo ? 'text-green-600' : 'text-red-600'}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
              <CardDescription>Dados básicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Código</div>
                  <div className="font-medium">{disciplina.codigo || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Nome</div>
                  <div className="font-medium">{disciplina.nome}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Créditos</div>
                  <div className="font-medium">{disciplina.creditos}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Carga Horária</div>
                  <div className="font-medium">{disciplina.cargaHoraria}h</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Curso</div>
                  <div className="font-medium">{disciplina.curso?.nome || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Vínculos com períodos</div>
                  <div className="font-medium">{vinculos.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Períodos vinculados</CardTitle>
              <CardDescription>Gerencie os períodos aos quais esta disciplina pertence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vinculos.length > 0 ? (
                <div className="space-y-3">
                  {vinculos.map((vinculo) => {
                    const periodoId = Number(vinculo.periodoId);
                    const periodoNome = vinculo.periodo?.nome || `Período ${vinculo.periodo?.numero ?? periodoId}`;
                    const ordemAtual = vinculo.ordem ?? undefined;

                    return (
                      <div
                        key={`${disciplina.id}-${periodoId}`}
                        className="border border-slate-200 rounded-lg p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{periodoNome}</div>
                          <div className="text-xs text-slate-500">
                            Currículo {vinculo.periodo?.curriculoId ?? '—'} · ID {periodoId}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Ordem</label>
                            <Input
                              type="number"
                              min={1}
                              defaultValue={ordemAtual ?? ''}
                              onBlur={(event) => handleUpdateOrdem(periodoId, event.target.value, ordemAtual)}
                              className="w-24"
                              disabled={updateRelationMutation.isPending}
                            />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-medium text-slate-500 mb-1">Obrigatoriedade</span>
                            <Button
                              type="button"
                              variant={vinculo.obrigatoria !== false ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleObrigatoria(periodoId, vinculo.obrigatoria !== false)}
                              disabled={updateRelationMutation.isPending}
                            >
                              {vinculo.obrigatoria !== false ? 'Obrigatória' : 'Optativa'}
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeRelationMutation.mutate(periodoId)}
                            disabled={removeRelationMutation.isPending}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhum período vinculado a esta disciplina.</p>
              )}

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Adicionar novo vínculo</h4>
                <form onSubmit={handleAddVinculo} className="grid gap-3 md:grid-cols-[2fr_1fr_auto] items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Período</label>
                    <select
                      value={selectedPeriodoId === '' ? '' : String(selectedPeriodoId)}
                      onChange={(event) =>
                        setSelectedPeriodoId(event.target.value ? Number(event.target.value) : '')
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      disabled={periodosParaAdicionar.length === 0 || addRelationMutation.isPending}
                    >
                      <option value="">
                        {periodosParaAdicionar.length
                          ? 'Selecione um período...'
                          : 'Todos os períodos já estão vinculados'}
                      </option>
                      {periodosParaAdicionar.map((periodo) => (
                        <option key={periodo.id} value={periodo.id}>
                          {periodo.nome || `Período ${periodo.numero}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Ordem (opcional)</label>
                    <Input
                      type="number"
                      min={1}
                      value={novaOrdem}
                      onChange={(event) => setNovaOrdem(event.target.value)}
                      className="w-full"
                      disabled={addRelationMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={novaObrigatoria}
                        onChange={(event) => setNovaObrigatoria(event.target.checked)}
                        disabled={addRelationMutation.isPending}
                      />
                      Obrigatória
                    </label>
                    <Button
                      type="submit"
                      disabled={typeof selectedPeriodoId !== 'number' || addRelationMutation.isPending}
                    >
                      {addRelationMutation.isPending ? 'Adicionando...' : 'Adicionar' }
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


