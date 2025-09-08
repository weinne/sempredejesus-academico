import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import CrudHeader from '@/components/crud/crud-header';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { DataList } from '@/components/crud/data-list';
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
  const [disciplinaId, setDisciplinaId] = useState<number | ''>('');
  const [professorId, setProfessorId] = useState<string | ''>('');
  const [search, setSearch] = useState('');
  const [nova, setNova] = useState<Partial<CreateAula>>({ data: '' });
  const [aulaId, setAulaId] = useState<number | ''>('');
  const [freqText, setFreqText] = useState('');

  const clearFilters = () => {
    setTurmaId('');
    setDisciplinaId('');
    setProfessorId('');
    setSearch('');
    refetch();
  };

  // Options for selects
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

  const { data: aulasResp, refetch } = useQuery({
    queryKey: ['aulas', turmaId, disciplinaId, professorId, search],
    queryFn: () => apiService.getAulas({
      turmaId: typeof turmaId === 'number' ? turmaId : undefined,
      disciplinaId: typeof disciplinaId === 'number' ? disciplinaId : undefined,
      professorId: (hasRole(Role.ADMIN) || hasRole(Role.SECRETARIA)) ? (professorId || undefined) : undefined,
      sortBy: 'data',
      sortOrder: 'desc',
    }).then(r => r.data),
  });
  const aulas = aulasResp || [];

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
      <CrudHeader title="Aulas & Frequência" description="Crie aulas e registre frequências" backTo="/dashboard" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Aulas Cadastradas</CardTitle>
            <CardDescription>Listagem de aulas cadastradas</CardDescription>
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
              <Input placeholder="Tópico ou observação" value={search} onChange={(e)=>setSearch(e.target.value)} className="w-64" />
            </div>

            <div className="ml-auto flex items-end gap-2">
              <Button onClick={() => refetch()}><List className="h-4 w-4 mr-2"/>Buscar</Button>
              <Button onClick={clearFilters}>Limpar filtros</Button>
            </div>
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
              <DataList
                items={aulas}
                viewMode={'table'}
                isLoading={false}
                columns={[
                  { key: 'data', header: 'Data' },
                  { key: 'topico', header: 'Tópico', render: (a: any) => a?.topico || '-' },
                  { key: 'observacao', header: 'Observação', render: (a: any) => a?.observacao || '-' },
                ]}
                cardRender={(a: any) => (
                  <Card>
                    <CardContent className="p-4">
                      <div className="font-medium">{a.data}</div>
                      <div className="text-sm text-gray-600">{a.topico || '-'}</div>
                      <div className="text-sm text-gray-600">{a.observacao || '-'}</div>
                    </CardContent>
                  </Card>
                )}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

