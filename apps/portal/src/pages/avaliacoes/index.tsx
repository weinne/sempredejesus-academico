import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Avaliacao, CreateAvaliacao, LancarNotaInput, Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Plus, List, Calendar } from 'lucide-react';
import CrudHeader from '@/components/crud/crud-header';

export default function AvaliacoesPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);
  const queryClient = useQueryClient();

  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [disciplinaId, setDisciplinaId] = useState<number | ''>('');
  const [professorId, setProfessorId] = useState<string | ''>('');
  const [search, setSearch] = useState('');
  const [novo, setNovo] = useState<Partial<CreateAvaliacao>>({ data: '', tipo: 'PROVA', peso: 10 });
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<number | null>(null);
  const [notasText, setNotasText] = useState('');

  const { data: turmasOptions = [] } = useQuery({
    queryKey: ['turmas-options'],
    queryFn: () => apiService.getTurmas({ limit: 1000 }).then(r => r.data),
  });
  const { data: disciplinasOptions = [] } = useQuery({
    queryKey: ['disciplinas-options'],
    queryFn: () => apiService.getDisciplinas({ limit: 1000 }).then(r => r.data),
  });
  const { data: professoresOptions = [] } = useQuery({
    queryKey: ['professores-options'],
    queryFn: () => apiService.getProfessores({ limit: 1000 }).then(r => r.data),
    enabled: hasRole([Role.ADMIN, Role.SECRETARIA]),
  });

  const { data: avalResp, refetch, isFetching } = useQuery({
    queryKey: ['avaliacoes', turmaId, disciplinaId, professorId, search],
    queryFn: () => apiService.getAvaliacoes({
      turmaId: typeof turmaId === 'number' ? turmaId : undefined,
      disciplinaId: typeof disciplinaId === 'number' ? disciplinaId : undefined,
      professorId: (hasRole(Role.ADMIN) || hasRole(Role.SECRETARIA)) ? (professorId || undefined) : undefined,
      sortBy: 'data',
      sortOrder: 'desc',
    }).then(r => r.data),
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

