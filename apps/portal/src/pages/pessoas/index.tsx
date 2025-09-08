import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Pessoa, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import CrudHeader from '@/components/crud/crud-header';
import CrudToolbar from '@/components/crud/crud-toolbar';
import { DataList } from '@/components/crud/data-list';
import { Pagination } from '@/components/crud/pagination';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const pessoaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sexo: z.enum(['M', 'F']).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  data_nascimento: z.string().optional(),
});

type PessoaFormData = z.infer<typeof pessoaSchema>;

export default function PessoasPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<Pessoa | null>(null);



  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PessoaFormData>({
    resolver: zodResolver(pessoaSchema),
  });

  // Fetch pessoas
  const {
    data: pessoas = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pessoas'],
    queryFn: apiService.getPessoas,
    retry: false, // Don't retry in development with mock data
  });



  // Create mutation
  const createMutation = useMutation({
    mutationFn: (pessoa: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>) => apiService.createPessoa(pessoa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({
        title: 'Pessoa criada',
        description: 'Pessoa criada com sucesso!',
      });
      setShowForm(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar pessoa',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pessoa> }) =>
      apiService.updatePessoa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({
        title: 'Pessoa atualizada',
        description: 'Pessoa atualizada com sucesso!',
      });
      setShowForm(false);
      setEditingPessoa(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar pessoa',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deletePessoa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({
        title: 'Pessoa removida',
        description: 'Pessoa removida com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover pessoa',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  // Filter pessoas by search term
  const filteredPessoas = pessoas.filter((pessoa) =>
    pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pessoa.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pessoa.cpf || '').includes(searchTerm)
  );

  // Handle form submission
  const onSubmit = (data: PessoaFormData) => {
    if (editingPessoa) {
      updateMutation.mutate({ id: editingPessoa.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (pessoa: Pessoa) => {
    setEditingPessoa(pessoa);
    setShowForm(true);
    reset({
      nome: pessoa.nome,
      sexo: pessoa.sexo,
      email: pessoa.email || '',
      cpf: pessoa.cpf || '',
      telefone: pessoa.telefone || '',
      endereco: pessoa.endereco || '',
      data_nascimento: pessoa.data_nascimento || '',
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta pessoa?')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle new person
  const handleNew = () => {
    setEditingPessoa(null);
    setShowForm(true);
    reset();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar dados</h2>
              <p className="text-gray-600">Não foi possível conectar com o servidor.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'));
  useEffect(() => {
    const onResize = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title="Gerenciar Pessoas"
        description="Cadastro e edição de pessoas"
        backTo="/dashboard"
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <CrudToolbar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Busque por nome, email ou CPF..."
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingPessoa ? 'Editar Pessoa' : 'Nova Pessoa'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                      <Input {...register('nome')} className={errors.nome ? 'border-red-500' : ''} />
                      {errors.nome && (<p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                      <select {...register('sexo')} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.sexo ? 'border-red-500' : ''}`}>
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                      {errors.sexo && (<p className="mt-1 text-sm text-red-600">{errors.sexo.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
                      {errors.email && (<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                      <Input {...register('cpf')} placeholder="000.000.000-00" className={errors.cpf ? 'border-red-500' : ''} />
                      {errors.cpf && (<p className="mt-1 text-sm text-red-600">{errors.cpf.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                      <Input {...register('telefone')} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                      <Input {...register('endereco')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                      <Input type="date" {...register('data_nascimento')} />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {editingPessoa && (
                      <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
                    )}
                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingPessoa(null); reset(); }}>Fechar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Pessoas Cadastradas ({filteredPessoas.length})</CardTitle>
              <CardDescription>Lista de todas as pessoas cadastradas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={filteredPessoas}
                viewMode={viewMode}
                isLoading={isLoading}
                columns={[
                  { key: 'nome', header: 'Nome' },
                  { key: 'email', header: 'Email' },
                  { key: 'cpf', header: 'CPF' },
                  { key: 'actions', header: 'Ações', render: (p: any) => (
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) },
                ]}
                cardRender={(pessoa: any) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-5 w-5 text-gray-400" />
                          <h3 className="font-semibold text-gray-900 truncate">{pessoa.nome}</h3>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(pessoa)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{pessoa.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">{pessoa.cpf}</span>
                        </div>
                        {pessoa.telefone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{pessoa.telefone}</span>
                          </div>
                        )}
                        {pessoa.data_nascimento && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(pessoa.data_nascimento).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                emptyState={
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{searchTerm ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa cadastrada'}</p>
                  </div>
                }
              />

              <Pagination
                page={1}
                totalPages={1}
                onChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}