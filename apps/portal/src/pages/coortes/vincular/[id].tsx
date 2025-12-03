import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePageHero } from '@/hooks/use-page-hero';
import { apiService } from '@/services/api';
import { Aluno, Coorte } from '@/types/api';
import { Users, Plus, RefreshCw, Trash2, GraduationCap, Search, ArrowLeft } from 'lucide-react';

const getAlunoNome = (aluno: Aluno) =>
  aluno.pessoa?.nome?.trim() || aluno.pessoa?.nomeCompleto?.trim() || 'Aluno sem nome';

export default function CoorteVincularAlunosPage() {
  const { id } = useParams<{ id: string }>();
  const coorteId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coorte, isLoading: loadingCoorte } = useQuery({
    queryKey: ['coorte', coorteId],
    queryFn: () => apiService.getCoorte(coorteId),
    enabled: Number.isFinite(coorteId),
  });

  const { data: alunosCoorteResponse, isLoading: loadingAlunosCoorte } = useQuery({
    queryKey: ['alunos', 'coorte', coorteId],
    queryFn: () => apiService.getAlunos({ limit: 500, coorteId, sortBy: 'ra', sortOrder: 'asc' }),
    enabled: Number.isFinite(coorteId),
  });
  const alunosNaCoorte = alunosCoorteResponse?.data || [];

  const { data: alunosResponse } = useQuery({
    queryKey: ['alunos', 'todos', 'coorte-link'],
    queryFn: () => apiService.getAlunos({ limit: 500, sortBy: 'ra', sortOrder: 'asc' }),
  });
  const todosAlunos = alunosResponse?.data || [];

  const alunosDisponiveis = useMemo(() => {
    if (!coorte) return todosAlunos;
    return todosAlunos.filter((aluno) => aluno.coorteId !== coorteId && aluno.cursoId === coorte.cursoId);
  }, [todosAlunos, coorteId, coorte]);

  const [novoAlunoRa, setNovoAlunoRa] = useState('');
  const [searchDisponiveis, setSearchDisponiveis] = useState('');
  const [bulkSelecionados, setBulkSelecionados] = useState<string[]>([]);

  const disponiveisFiltrados = useMemo(() => {
    const term = searchDisponiveis.trim().toLowerCase();
    if (!term) return alunosDisponiveis;
    return alunosDisponiveis.filter(
      (aluno) =>
        aluno.ra.includes(term) ||
        getAlunoNome(aluno).toLowerCase().includes(term) ||
        (aluno.curso?.nome || '').toLowerCase().includes(term)
    );
  }, [alunosDisponiveis, searchDisponiveis]);

  const linkAluno = useMutation({
    mutationFn: (ra: string) => apiService.updateAluno(ra, { coorteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos', 'coorte', coorteId] });
      queryClient.invalidateQueries({ queryKey: ['alunos', 'todos', 'coorte-link'] });
      setNovoAlunoRa('');
      toast({ title: 'Aluno vinculado', description: 'Aluno vinculado à coorte com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao vincular aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const bulkLinkAlunos = useMutation({
    mutationFn: async (ras: string[]) => {
      await Promise.all(ras.map((ra) => apiService.updateAluno(ra, { coorteId })));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alunos', 'coorte', coorteId] });
      queryClient.invalidateQueries({ queryKey: ['alunos', 'todos', 'coorte-link'] });
      setBulkSelecionados([]);
      toast({
        title: 'Alunos vinculados',
        description: `${variables.length} aluno(s) vinculados à coorte`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao vincular em massa',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const removerAluno = useMutation({
    mutationFn: (ra: string) => apiService.updateAluno(ra, { coorteId: null as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos', 'coorte', coorteId] });
      queryClient.invalidateQueries({ queryKey: ['alunos', 'todos', 'coorte-link'] });
      toast({ title: 'Aluno removido', description: 'Aluno desvinculado da coorte.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  usePageHero({
    title: coorte ? `Vincular alunos • ${coorte.rotulo}` : 'Vincular alunos à coorte',
    description: 'Associe alunos individualmente ou em lote a esta coorte.',
    backTo: `/coortes/view/${coorteId}`,
    actions: (
      <Button variant="secondary" onClick={() => navigate('/alunos')}>
        <Users className="h-4 w-4 mr-2" />
        Ver alunos
      </Button>
    ),
  });

  if (!Number.isFinite(coorteId)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <span>•</span>
          <span>{coorte?.rotulo || 'Coorte'}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar aluno individualmente
              </CardTitle>
              <CardDescription>
                Escolha um aluno disponível (do mesmo curso) e vincule a esta coorte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Filtrar alunos</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome ou RA..."
                    value={searchDisponiveis}
                    onChange={(event) => setSearchDisponiveis(event.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aluno</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={novoAlunoRa}
                  onChange={(event) => setNovoAlunoRa(event.target.value)}
                >
                  <option value="">Selecione...</option>
                  {disponiveisFiltrados.map((aluno) => (
                    <option key={aluno.ra} value={aluno.ra}>
                      {getAlunoNome(aluno)} — RA {aluno.ra}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => novoAlunoRa && linkAluno.mutate(novoAlunoRa)}
                disabled={linkAluno.isPending || !novoAlunoRa}
              >
                Vincular aluno
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Vincular vários alunos
              </CardTitle>
              <CardDescription>
                Selecione múltiplos alunos disponíveis e vincule todos de uma vez.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-white">
                {disponiveisFiltrados.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum aluno disponível para vincular.</p>
                ) : (
                  <div className="space-y-1">
                    {disponiveisFiltrados.map((aluno) => (
                      <label key={aluno.ra} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300"
                          checked={bulkSelecionados.includes(aluno.ra)}
                          onChange={(event) => {
                            setBulkSelecionados((prev) =>
                              event.target.checked
                                ? [...prev, aluno.ra]
                                : prev.filter((ra) => ra !== aluno.ra)
                            );
                          }}
                        />
                        <span className="truncate">
                          {getAlunoNome(aluno)} — RA {aluno.ra}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => bulkSelecionados.length > 0 && bulkLinkAlunos.mutate(bulkSelecionados)}
                  disabled={bulkLinkAlunos.isPending || bulkSelecionados.length === 0}
                >
                  Vincular selecionados ({bulkSelecionados.length})
                </Button>
                <Button variant="outline" onClick={() => setBulkSelecionados([])}>
                  Limpar seleção
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alunos vinculados ({alunosNaCoorte.length})</CardTitle>
                <CardDescription>
                  Alunos atualmente associados a esta coorte.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['alunos', 'coorte', coorteId] })}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCoorte || loadingAlunosCoorte ? (
              <div className="text-center py-6 text-slate-500">Carregando alunos...</div>
            ) : alunosNaCoorte.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                Nenhum aluno vinculado ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">Aluno</th>
                      <th className="px-4 py-2 text-left">RA</th>
                      <th className="px-4 py-2 text-left">Curso</th>
                      <th className="px-4 py-2 text-left">Período</th>
                      <th className="px-4 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {alunosNaCoorte.map((aluno) => (
                      <tr key={aluno.ra}>
                        <td className="px-4 py-2">{getAlunoNome(aluno)}</td>
                        <td className="px-4 py-2">{aluno.ra}</td>
                        <td className="px-4 py-2">{aluno.curso?.nome || '—'}</td>
                        <td className="px-4 py-2">{aluno.periodo?.nome || aluno.periodo?.numero || '—'}</td>
                        <td className="px-4 py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removerAluno.mutate(aluno.ra)}
                            disabled={removerAluno.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

