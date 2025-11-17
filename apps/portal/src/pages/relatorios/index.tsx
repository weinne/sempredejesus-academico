import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { usePageHero } from '@/hooks/use-page-hero';
import { StatCard } from '@/components/ui/stats-card';
import { ArrowLeft, Search, BarChart3, FileText, TrendingUp, Users, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiService } from '@/services/api';

export default function RelatoriosPage() {
  const [alunoId, setAlunoId] = useState('');
  const [turmaId, setTurmaId] = useState<number | ''>('');
  const [disciplinaId, setDisciplinaId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [historico, setHistorico] = useState<any[] | null>(null);
  const [freq, setFreq] = useState<any[] | null>(null);
  const [desempenho, setDesempenho] = useState<any | null>(null);

  // Configure Hero via hook
  usePageHero({
    title: "Análise e relatórios do sistema",
    description: "Gere relatórios detalhados sobre histórico acadêmico, frequência e desempenho dos alunos.",
    backTo: "/dashboard",
    stats: [
      { value: '4', label: 'Tipos de Relatórios' },
      { value: '100%', label: 'Cobertura' },
      { value: 'Real-time', label: 'Dados' },
      { value: 'PDF/Excel', label: 'Exportação' }
    ],
    actionLink: {
      href: '/dashboard',
      label: 'Ver dashboard'
    }
  });

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tipos de Relatórios"
            value="4"
            icon={FileText}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Cobertura"
            value="100%"
            icon={CheckCircle}
            iconColor="text-green-600"
          />
          <StatCard
            title="Dados"
            value="Real-time"
            icon={TrendingUp}
            iconColor="text-yellow-600"
          />
          <StatCard
            title="Exportação"
            value="PDF/Excel"
            icon={BarChart3}
            iconColor="text-purple-600"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico Acadêmico</CardTitle>
            <CardDescription>Informe o RA do aluno</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Input placeholder="RA do aluno" value={alunoId} onChange={e=>setAlunoId(e.target.value)} className="w-64"/>
              <Button onClick={async ()=> setHistorico(await apiService.reportHistorico(alunoId))}><Search className="h-4 w-4 mr-2"/>Buscar</Button>
            </div>
            {historico && (
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto max-h-80">{JSON.stringify(historico, null, 2)}</pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frequência por Turma</CardTitle>
            <CardDescription>Selecione a turma e (opcionalmente) um período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input type="number" placeholder="Turma ID" value={turmaId} onChange={e=>setTurmaId(e.target.value?Number(e.target.value):'')}/>
              <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
              <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
              <Button onClick={async ()=> setFreq(await apiService.reportFrequencia(Number(turmaId), startDate||undefined, endDate||undefined))}><Search className="h-4 w-4 mr-2"/>Gerar</Button>
            </div>
            {freq && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">RA</th>
                      <th className="py-2 pr-4">Nome</th>
                      <th className="py-2 pr-4">Presenças</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2 pr-4">%</th></tr>
                  </thead>
                  <tbody>
                    {freq.map((r:any, idx:number) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 pr-4">{r.ra}</td>
                        <td className="py-2 pr-4">{r.nome}</td>
                        <td className="py-2 pr-4">{r.presencas}</td>
                        <td className="py-2 pr-4">{r.totalAulas}</td>
                        <td className="py-2 pr-4">{r.frequencia}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Disciplina</CardTitle>
            <CardDescription>Selecione a disciplina</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input type="number" placeholder="Disciplina ID" value={disciplinaId} onChange={e=>setDisciplinaId(e.target.value?Number(e.target.value):'')} />
              <Button onClick={async ()=> setDesempenho(await apiService.reportDesempenho(Number(disciplinaId)))}><Search className="h-4 w-4 mr-2"/>Gerar</Button>
            </div>
            {desempenho && (
              <div className="text-sm text-gray-700">Turmas: {desempenho.turmas} | Alunos: {desempenho.alunos} | Média geral: {desempenho.mediaGeral ?? '-'}</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
