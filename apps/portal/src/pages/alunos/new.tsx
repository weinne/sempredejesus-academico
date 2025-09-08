import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Aluno, CreateAlunoWithUser, Pessoa, Curso } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import PessoaFormModal from '@/components/modals/pessoa-form-modal';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const alunoSchema = z.object({
  ra: z.string().max(8).optional(),
  pessoaId: z.number().min(1, 'Selecione uma pessoa'),
  cursoId: z.number().min(1, 'Selecione um curso'),
  anoIngresso: z.number().min(1900).max(2100),
  igreja: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO']),
  coeficienteAcad: z.number().min(0).max(10).optional(),
  createUser: z.boolean().default(false),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
});

type AlunoFormData = z.infer<typeof alunoSchema>;

export default function AlunoNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPessoaModal, setShowPessoaModal] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: { situacao: 'ATIVO', anoIngresso: new Date().getFullYear(), createUser: false },
  });
  const createUser = watch('createUser');

  const { data: pessoas = [] } = useQuery({ queryKey: ['pessoas'], queryFn: apiService.getPessoas });
  const { data: cursosResponse } = useQuery({ queryKey: ['cursos'], queryFn: () => apiService.getCursos({ limit: 100 }) });
  const cursos = cursosResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (aluno: CreateAlunoWithUser) => apiService.createAluno(aluno),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast({ title: 'Aluno criado', description: result.user ? `Aluno e usuário criados! Username: ${result.user.username}` : 'Aluno criado com sucesso!' });
      navigate('/alunos');
    },
    onError: (error: any) => toast({ title: 'Erro ao criar aluno', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const createPessoaMutation = useMutation({
    mutationFn: (pessoa: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>) => apiService.createPessoa(pessoa),
    onSuccess: (newPessoa) => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({ title: 'Pessoa criada', description: 'Pessoa criada com sucesso!' });
      setShowPessoaModal(false);
      // Optional: could auto-select new pessoa via setValue if desired
    },
    onError: (error: any) => toast({ title: 'Erro ao criar pessoa', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const onSubmit = (data: AlunoFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Nova Matrícula" backTo="/alunos" description="Cadastro de aluno" />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Nova Matrícula</CardTitle>
              <CardDescription>Complete o formulário para matricular um novo aluno</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Matrícula</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RA (opcional - será gerado automaticamente)</label>
                      <Input {...register('ra')} placeholder="Ex: 20241001" className={errors.ra ? 'border-red-500' : ''} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa *</label>
                      <div className="flex space-x-2">
                        <select {...register('pessoaId', { valueAsNumber: true })} className={`flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.pessoaId ? 'border-red-500' : ''}`}>
                          <option value="">Selecione uma pessoa...</option>
                          {pessoas.map((pessoa) => (
                            <option key={pessoa.id} value={Number(pessoa.id)}>{pessoa.nome} {pessoa.email ? `(${pessoa.email})` : ''}</option>
                          ))}
                        </select>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowPessoaModal(true)} className="px-3" title="Cadastrar nova pessoa">+</Button>
                      </div>
                      {errors.pessoaId && (<p className="mt-1 text-sm text-red-600">{errors.pessoaId.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                      <select {...register('cursoId', { valueAsNumber: true })} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.cursoId ? 'border-red-500' : ''}`}>
                        <option value="">Selecione um curso...</option>
                        {cursos.map((curso: Curso) => (
                          <option key={curso.id} value={curso.id}>{curso.nome} ({curso.grau})</option>
                        ))}
                      </select>
                      {errors.cursoId && (<p className="mt-1 text-sm text-red-600">{errors.cursoId.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ano de Ingresso *</label>
                      <Input type="number" min="1900" max="2100" {...register('anoIngresso', { valueAsNumber: true })} className={errors.anoIngresso ? 'border-red-500' : ''} />
                      {errors.anoIngresso && (<p className="mt-1 text-sm text-red-600">{errors.anoIngresso.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Situação *</label>
                      <select {...register('situacao')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        <option value="ATIVO">Ativo</option>
                        <option value="TRANCADO">Trancado</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coeficiente Acadêmico</label>
                      <Input type="number" step="0.1" min="0" max="10" {...register('coeficienteAcad', { valueAsNumber: true })} placeholder="Ex: 8.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Complementares</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Igreja de Origem</label>
                      <Input {...register('igreja')} placeholder="Nome da igreja" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Acesso ao Sistema</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input type="checkbox" {...register('createUser')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <label className="ml-2 block text-sm text-gray-900">Criar usuário de acesso para o aluno</label>
                    </div>
                    {createUser && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-blue-500 pl-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                          <Input {...register('username')} placeholder="Ex: joao.silva" className={errors.username ? 'border-red-500' : ''} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                          <Input type="password" {...register('password')} className={errors.password ? 'border-red-500' : ''} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Matricular</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/alunos')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <PessoaFormModal
        isOpen={showPessoaModal}
        onClose={() => setShowPessoaModal(false)}
        onSubmit={(data) => createPessoaMutation.mutate(data)}
        isLoading={createPessoaMutation.isPending}
      />
    </div>
  );
}


