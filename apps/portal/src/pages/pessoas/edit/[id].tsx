import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function PessoaEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pessoa, isLoading } = useQuery({
    queryKey: ['pessoa', id],
    queryFn: () => apiService.getPessoa(String(id!)),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiService.updatePessoa(String(id!), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['pessoa', id] });
      toast({ title: 'Pessoa atualizada', description: 'Pessoa atualizada com sucesso!' });
      navigate('/pessoas');
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar pessoa', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  if (isLoading || !pessoa) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Pessoa" backTo="/pessoas" />
        <div className="max-w-4xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title={`Editar Pessoa: ${pessoa.nome}`} backTo="/pessoas" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Pessoa</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  updateMutation.mutate({
                    nome: String(fd.get('nome') || pessoa.nome),
                    sexo: String(fd.get('sexo') || pessoa.sexo || ''),
                    email: String(fd.get('email') || pessoa.email || ''),
                    cpf: String(fd.get('cpf') || pessoa.cpf || ''),
                    telefone: String(fd.get('telefone') || pessoa.telefone || ''),
                    endereco: String(fd.get('endereco') || pessoa.endereco || ''),
                    data_nascimento: String(fd.get('data_nascimento') || pessoa.data_nascimento || ''),
                  });
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <Input name="nome" defaultValue={pessoa.nome} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select name="sexo" defaultValue={pessoa.sexo || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecione...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input name="email" type="email" defaultValue={pessoa.email || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <Input name="cpf" defaultValue={pessoa.cpf || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <Input name="telefone" defaultValue={pessoa.telefone || ''} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <Input name="endereco" defaultValue={pessoa.endereco || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <Input name="data_nascimento" type="date" defaultValue={pessoa.data_nascimento || ''} />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/pessoas')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


