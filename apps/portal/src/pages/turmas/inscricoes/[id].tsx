import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

import CrudHeader from '@/components/crud/crud-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Turma, Aluno, TurmaInscrito, CreateTurmaInscricao, BulkTurmaInscricao } from '@/types/api';

export default function TurmaInscricoesPage() {
  const { id } = useParams<{ id: string }>();
  const turmaId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useQuery({
    queryKey: ['turma', turmaId],
    queryFn: () => apiService.getTurma(turmaId),
    enabled: Number.isFinite(turmaId),
  });

  const { data: alunosResponse } = useQuery({
    queryKey: ['alunos', 'select'],
    queryFn: () => apiService.getAlunos({ limit: 200 }),
  });
  const alunos = alunosResponse?.data || [];

  const { data: coortes = [] } = useQuery({ queryKey: ['coortes'], queryFn: () => apiService.getCoortes() });

  const { data: inscritos = [], isLoading: loadingInscritos } = useQuery({
    queryKey: ['turma', turmaId, 'inscritos'],
    queryFn: () => apiService.getTurmaInscritos(turmaId),
    enabled: Number.isFinite(turmaId),
  });

  const [novoAlunoId, setNovoAlunoId] = useState('');
  const [statusAluno, setStatusAluno] = useState<'MATRICULADO' | 'APROVADO' | 'REPROVADO' | 'CANCELADO'>(
    'MATRICULADO',
  );
  const [coorteBulkId, setCoorteBulkId] = useState('');
  const [bulkStatus, setBulkStatus] = useState<'MATRICULADO' | 'APROVADO' | 'REPROVADO' | 'CANCELADO'>(
    'MATRICULADO',
  );

  const addInscricao = useMutation({
    mutationFn: (payload: CreateTurmaInscricao) => apiService.addTurmaInscricao(turmaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turma', turmaId, 'inscritos'] });
      toast({ title: 'Aluno adicionado', description: 'Inscrição registrada com sucesso!' });
      setNovoAlunoId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar aluno',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const addInscricoesBulk = useMutation({
    mutationFn: (payload: BulkTurmaInscricao) => apiService.addTurmaInscricaoEmLote(turmaId, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['turma', turmaId, 'inscritos'] });
      toast({
        title: 'Inscrições em lote',
        description: `Alunos adicionados: ${result.adicionados}, já vinculados: ${result.ignorados}`,
      });
      setCoorteBulkId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao inscrever em lote',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ inscricaoId, status }: { inscricaoId: number; status: TurmaInscrito['status'] }) =>
      apiService.updateTurmaInscricao(turmaId, inscricaoId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turma', turmaId, 'inscritos'] });
      toast({ title: 'Status atualizado' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const removeInscricao = useMutation({
    mutationFn: (inscricaoId: number) => apiService.deleteTurmaInscricao(turmaId, inscricaoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turma', turmaId, 'inscritos'] });
      toast({ title: 'Inscrição removida' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover inscrição',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  const alunosDisponiveis = useMemo(() => {
    const inscricaoSet = new Set(inscritos.map((item) => item.alunoId));
    return alunos.filter((aluno) => !inscricaoSet.has(aluno.ra));
  }, [alunos, inscritos]);

  const alunoOptions = useMemo(
    () =>
      alunosDisponiveis.map((aluno) => ({
        value: aluno.ra,
        label: `${aluno.pessoa?.nome || 'Aluno'} (${aluno.ra})`,
      })),
    [alunosDisponiveis],
  );

  const coorteOptions = useMemo(
    () =>
      coortes.map((coorte) => ({
        value: String(coorte.id),
        label: `${coorte.rotulo} • ${coorte.curso?.nome || 'Curso'}`,
      })),
    [coortes],
  );

  const toggleStatus = (status: TurmaInscrito['status']) =>
    status === 'MATRICULADO' ? 'APROVADO' : 'MATRICULADO';

  const onSubmitNovoAluno = (event: React.FormEvent) => {
    event.preventDefault();
    if (!novoAlunoId) {
      toast({ title: 'Selecione um aluno', variant: 'destructive' });
      return;
    }
    addInscricao.mutate({ alunoId: novoAlunoId, status: statusAluno });
  };

  const onSubmitBulk = (event: React.FormEvent) => {
    event.preventDefault();
    if (!coorteBulkId) {
      toast({ title: 'Selecione uma coorte', variant: 'destructive' });
      return;
    }
    addInscricoesBulk.mutate({ coorteId: Number(coorteBulkId), status: bulkStatus });
  };

  if (!Number.isFinite(turmaId)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title="Inscrições da turma"
        backTo={`/turmas/view/${turmaId}`}
        description="Gerencie matriculados, inscrições em lote e status"
      />

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar aluno individualmente
              </CardTitle>
              <CardDescription>Selecione um aluno e defina o status inicial</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmitNovoAluno}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="alunoId">
                    Aluno
                  </label>
                  <select
                    id="alunoId"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    value={novoAlunoId}
                    onChange={(event) => setNovoAlunoId(event.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {alunoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                    Status inicial
                  </label>
                  <select
                    id="status"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    value={statusAluno}
                    onChange={(event) => setStatusAluno(event.target.value as TurmaInscrito['status'])}
                  >
                    <option value="MATRICULADO">Matriculado</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="REPROVADO">Reprovado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={addInscricao.status === 'pending'}>
                    Adicionar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(`/alunos/new`)}>
                    Criar novo aluno
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Inscrever por coorte
              </CardTitle>
              <CardDescription>Selecione uma coorte para inscrever em massa</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmitBulk}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="coorteId">
                    Coorte
                  </label>
                  <select
                    id="coorteId"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    value={coorteBulkId}
                    onChange={(event) => setCoorteBulkId(event.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {coorteOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="bulkStatus">
                    Status para inscrições em lote
                  </label>
                  <select
                    id="bulkStatus"
                    className="w-full border rounded-md px-3 py-2"
                    value={bulkStatus}
                    onChange={(event) => setBulkStatus(event.target.value as TurmaInscrito['status'])}
                  >
                    <option value="MATRICULADO">Matriculado</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="REPROVADO">Reprovado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={addInscricoesBulk.status === 'pending'}>
                    Inscrever coorte inteira
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setCoorteBulkId('')}>
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alunos inscritos</CardTitle>
                <CardDescription>Gerencie status e presença dos alunos na turma</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['turma', turmaId, 'inscritos'] })}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar lista
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loadingInscritos ? (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                Carregando inscrições...
              </div>
            ) : inscritos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum aluno inscrito ainda.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Aluno</th>
                    <th className="px-4 py-2 text-left">RA</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Média</th>
                    <th className="px-4 py-2 text-left">Frequência</th>
                    <th className="px-4 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inscritos.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {item.aluno?.pessoa?.nome || 'Aluno sem nome'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.alunoId}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.status}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {item.media !== undefined && item.media !== null ? Number(item.media).toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {item.frequencia !== undefined && item.frequencia !== null
                          ? `${Number(item.frequencia).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus.mutate({ inscricaoId: item.id, status: toggleStatus(item.status) })}
                            disabled={updateStatus.status === 'pending'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Alternar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInscricao.mutate(item.id)}
                            disabled={removeInscricao.status === 'pending'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
