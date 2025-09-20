import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
              <p className="text-sm text-gray-600">Relatórios acadêmicos e gerenciais</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
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
