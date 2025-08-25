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

export default function AvaliacoesPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);
  const queryClient = useQueryClient();

  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [novo, setNovo] = useState<Partial<CreateAvaliacao>>({ data: '', tipo: 'PROVA', peso: 10 });
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<number | null>(null);
  const [notasText, setNotasText] = useState('');

  const { data: avaliacoes = [], refetch, isFetching } = useQuery({
    queryKey: ['avaliacoes', turmaId],
    queryFn: () => apiService.getAvaliacoes(Number(turmaId)),
    enabled: typeof turmaId === 'number' && turmaId > 0,
  });

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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button></Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
              <p className="text-sm text-gray-600">Gerencie avaliações e lançamento de notas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Turma</CardTitle>
            <CardDescription>Informe o ID da turma para listar/registrar avaliações</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Input type="number" placeholder="ID da Turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value ? Number(e.target.value) : '')} className="w-40"/>
            <Button onClick={() => refetch()} disabled={!(typeof turmaId === 'number' && turmaId>0) || isFetching}><List className="h-4 w-4 mr-2"/>Buscar</Button>
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
                  <Input placeholder="Tipo (PROVA/TRABALHO/...)" value={novo.tipo as string || ''} onChange={e=>setNovo(v=>({...v, tipo: e.target.value as any}))}/>
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

