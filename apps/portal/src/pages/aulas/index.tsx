import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Aula, CreateAula, LancarFrequenciaInput, Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Send, List } from 'lucide-react';

export default function AulasPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA, Role.PROFESSOR]);

  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [nova, setNova] = useState<Partial<CreateAula>>({ data: '' });
  const [aulaId, setAulaId] = useState<number | ''>('');
  const [freqText, setFreqText] = useState('');

  const { data: aulas = [], refetch } = useQuery({
    queryKey: ['aulas', turmaId],
    queryFn: () => apiService.getAulas(Number(turmaId)),
    enabled: typeof turmaId === 'number' && turmaId > 0,
  });

  const criar = useMutation({
    mutationFn: (payload: CreateAula) => apiService.createAula(payload),
    onSuccess: () => { toast({ title: 'Aula criada' }); refetch(); },
    onError: (e: any) => toast({ title: 'Erro ao criar aula', description: e.message, variant: 'destructive' }),
  });

  const lancar = useMutation({
    mutationFn: ({ aulaId, frequencias }: { aulaId: number; frequencias: LancarFrequenciaInput[] }) => apiService.lancarFrequencias(aulaId, frequencias),
    onSuccess: () => { toast({ title: 'Frequências registradas' }); setFreqText(''); },
    onError: (e: any) => toast({ title: 'Erro ao registrar frequência', description: e.message, variant: 'destructive' }),
  });

  const parseFreq = (text: string): LancarFrequenciaInput[] =>
    text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const [inscricaoId, presenteStr, justificativa] = l.split(/[,;\t]/).map(s => s.trim());
        return { inscricaoId: Number(inscricaoId), presente: presenteStr === '1' || /^true$/i.test(presenteStr), justificativa } as LancarFrequenciaInput;
      })
      .filter(f => !Number.isNaN(f.inscricaoId));

  const handleCreate = () => {
    if (!canEdit || typeof turmaId !== 'number') return;
    const payload: CreateAula = {
      turmaId,
      data: String(nova.data || ''),
      topico: nova.topico || undefined,
      materialUrl: nova.materialUrl || undefined,
      observacao: nova.observacao || undefined,
    };
    criar.mutate(payload);
  };

  const handleLancar = () => {
    if (!(typeof aulaId === 'number')) return;
    const frequencias = parseFreq(freqText);
    if (frequencias.length === 0) {
      toast({ title: 'Informe as frequências', variant: 'destructive' });
      return;
    }
    lancar.mutate({ aulaId, frequencias });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button></Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Aulas & Frequência</h1>
              <p className="text-sm text-gray-600">Crie aulas e registre frequências</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Turma</CardTitle>
            <CardDescription>Informe o ID da turma para listar/registrar aulas</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Input type="number" placeholder="ID da Turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value ? Number(e.target.value) : '')} className="w-40"/>
            <Button onClick={() => refetch()} disabled={!(typeof turmaId === 'number' && turmaId>0)}><List className="h-4 w-4 mr-2"/>Buscar</Button>
          </CardContent>
        </Card>

        {typeof turmaId === 'number' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nova Aula</CardTitle>
                <CardDescription>Criar aula para a turma {turmaId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={nova.data as string || ''} onChange={e=>setNova(v=>({...v, data: e.target.value}))}/>
                  <Input placeholder="Tópico" value={nova.topico || ''} onChange={e=>setNova(v=>({...v, topico: e.target.value}))}/>
                  <Input placeholder="Material URL" value={nova.materialUrl || ''} onChange={e=>setNova(v=>({...v, materialUrl: e.target.value}))}/>
                  <Input placeholder="Observação" value={nova.observacao || ''} onChange={e=>setNova(v=>({...v, observacao: e.target.value}))}/>
                </div>
                <div className="flex justify-end"><Button disabled={!canEdit} onClick={handleCreate}><Plus className="h-4 w-4 mr-2"/>Criar</Button></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrar Frequência</CardTitle>
                <CardDescription>Selecione a aula e cole inscricaoId;presente;justificativa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <select className="border rounded px-2 py-2 w-full" value={aulaId ?? ''} onChange={e=>setAulaId(e.target.value? Number(e.target.value): '')}>
                  <option value="">Selecione a aula</option>
                  {aulas.map(a => (
                    <option key={a.id} value={a.id}>{a.data} - {a.topico || 'Sem tópico'}</option>
                  ))}
                </select>
                <textarea className="w-full h-40 border rounded p-2" placeholder="123;1;Chegou atrasado\n456;0;Justificou" value={freqText} onChange={e=>setFreqText(e.target.value)} />
                <div className="flex justify-end"><Button disabled={!(typeof aulaId === 'number')} onClick={handleLancar}><Send className="h-4 w-4 mr-2"/>Salvar</Button></div>
              </CardContent>
            </Card>
          </div>
        )}

        {typeof turmaId === 'number' && (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Aulas</CardTitle>
              <CardDescription>{aulas.length} itens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Data</th>
                      <th className="py-2 pr-4">Tópico</th>
                      <th className="py-2 pr-4">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aulas.map(a => (
                      <tr key={a.id} className="border-b">
                        <td className="py-2 pr-4">{a.data}</td>
                        <td className="py-2 pr-4">{a.topico || '-'}</td>
                        <td className="py-2 pr-4">{a.observacao || '-'}</td>
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

