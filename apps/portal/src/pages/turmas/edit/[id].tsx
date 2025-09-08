import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { CreateTurma } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

export default function TurmaEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: turma, isLoading } = useQuery({
    queryKey: ['turma', id],
    queryFn: () => apiService.getTurma(Number(id)),
    enabled: !!id,
  });

  const { data: disciplinasResponse } = useQuery({ queryKey: ['disciplinas'], queryFn: () => apiService.getDisciplinas({ limit: 100 }) });
  const disciplinas = disciplinasResponse?.data || [];
  const { data: professoresResponse } = useQuery({ queryKey: ['professores'], queryFn: () => apiService.getProfessores({ limit: 100 }) });
  const professores = professoresResponse?.data || [];
  const { data: semestres = [] } = useQuery({ queryKey: ['semestres'], queryFn: apiService.getSemestres });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreateTurma>) => apiService.updateTurma(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      queryClient.invalidateQueries({ queryKey: ['turma', id] });
      toast({ title: 'Turma atualizada', description: 'Turma atualizada com sucesso!' });
      navigate('/turmas');
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar turma', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  if (isLoading || !turma) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Turma" backTo="/turmas" />
        <div className="max-w-5xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  const getSemestreLabel = (s: any) => `${s.ano}.${s.periodo}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title={`Editar Turma ${turma.disciplina?.codigo || turma.id}`} backTo="/turmas" />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Turma</CardTitle>
              <CardDescription>Atualize os dados da turma</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const fd = new FormData(form);
                  updateMutation.mutate({
                    disciplinaId: Number(fd.get('disciplinaId')),
                    professorId: String(fd.get('professorId') || ''),
                    semestreId: Number(fd.get('semestreId')),
                    sala: String(fd.get('sala') || ''),
                    horario: String(fd.get('horario') || ''),
                    secao: String(fd.get('secao') || ''),
                  });
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina *</label>
                  <select name="disciplinaId" defaultValue={turma.disciplinaId} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecione uma disciplina...</option>
                    {disciplinas.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.codigo} - {d.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professor *</label>
                  <select name="professorId" defaultValue={turma.professorId} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecione um professor...</option>
                    {professores.map((p: any) => (
                      <option key={p.matricula} value={p.matricula}>{p.pessoa?.nome || 'Nome não informado'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semestre *</label>
                  <select name="semestreId" defaultValue={turma.semestreId} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecione um semestre...</option>
                    {semestres.map((s: any) => (
                      <option key={s.id} value={s.id}>{getSemestreLabel(s)} {s.ativo ? '(Ativo)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                  <Input name="sala" defaultValue={turma.sala || ''} placeholder="Ex: Sala 101, Lab A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                  <Input name="horario" defaultValue={turma.horario || ''} placeholder="Ex: Seg 08:00-10:00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seção</label>
                  <Input name="secao" defaultValue={turma.secao || ''} placeholder="Ex: A, B, C" />
                </div>
                <div className="md:col-span-3 flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
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


