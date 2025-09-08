import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { CreateTurma } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

export default function TurmaNewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: disciplinasResponse } = useQuery({ queryKey: ['disciplinas'], queryFn: () => apiService.getDisciplinas({ limit: 100 }) });
  const disciplinas = disciplinasResponse?.data || [];
  const { data: professoresResponse } = useQuery({ queryKey: ['professores'], queryFn: () => apiService.getProfessores({ limit: 100 }) });
  const professores = professoresResponse?.data || [];
  const { data: semestres = [] } = useQuery({ queryKey: ['semestres'], queryFn: apiService.getSemestres });

  const createMutation = useMutation({
    mutationFn: (payload: CreateTurma) => apiService.createTurma(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast({ title: 'Turma criada', description: 'Turma criada com sucesso!' });
      navigate('/turmas');
    },
    onError: (error: any) => toast({ title: 'Erro ao criar turma', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const getSemestreLabel = (s: any) => `${s.ano}.${s.periodo}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Nova Turma" backTo="/turmas" description="Crie uma nova turma" />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Turma</CardTitle>
              <CardDescription>Complete o formulário para criar uma nova turma</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const fd = new FormData(form);
                  createMutation.mutate({
                    disciplinaId: Number(fd.get('disciplinaId')),
                    professorId: String(fd.get('professorId') || ''),
                    semestreId: Number(fd.get('semestreId')),
                    sala: String(fd.get('sala') || ''),
                    horario: String(fd.get('horario') || ''),
                    secao: String(fd.get('secao') || ''),
                  } as any);
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina *</label>
                  <select name="disciplinaId" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecione uma disciplina...</option>
                    {disciplinas.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.codigo} - {d.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professor *</label>
                  <select name="professorId" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecione um professor...</option>
                    {professores.map((p: any) => (
                      <option key={p.matricula} value={p.matricula}>{p.pessoa?.nome || 'Nome não informado'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semestre *</label>
                  <select name="semestreId" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecione um semestre...</option>
                    {semestres.map((s: any) => (
                      <option key={s.id} value={s.id}>{getSemestreLabel(s)} {s.ativo ? '(Ativo)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                  <Input name="sala" placeholder="Ex: Sala 101, Lab A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                  <Input name="horario" placeholder="Ex: Seg 08:00-10:00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seção</label>
                  <Input name="secao" placeholder="Ex: A, B, C" />
                </div>
                <div className="md:col-span-3 flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/turmas')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


