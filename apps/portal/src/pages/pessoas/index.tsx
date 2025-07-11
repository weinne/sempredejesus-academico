import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { apiService } from '@/services/api';
import { Pessoa, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
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
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  email: z.string().email('Email inválido'),
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
    mutationFn: apiService.createPessoa,
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
    mutationFn: apiService.deletePessoa,
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
    pessoa.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pessoa.cpf.includes(searchTerm)
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
      cpf: pessoa.cpf,
      email: pessoa.email,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Pessoas</h1>
                <p className="text-sm text-gray-600">Cadastro e edição de pessoas</p>
              </div>
            </div>
            {canEdit && (
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Pessoa
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Buscar Pessoas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Busque por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Form */}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo *
                      </label>
                      <Input
                        {...register('nome')}
                        className={errors.nome ? 'border-red-500' : ''}
                      />
                      {errors.nome && (
                        <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CPF *
                      </label>
                      <Input
                        {...register('cpf')}
                        placeholder="000.000.000-00"
                        className={errors.cpf ? 'border-red-500' : ''}
                      />
                      {errors.cpf && (
                        <p className="mt-1 text-sm text-red-600">{errors.cpf.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <Input
                        type="email"
                        {...register('email')}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <Input
                        {...register('telefone')}
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço
                      </label>
                      <Input {...register('endereco')} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Nascimento
                      </label>
                      <Input
                        type="date"
                        {...register('data_nascimento')}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isLoading || updateMutation.isLoading}
                    >
                      {editingPessoa ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingPessoa(null);
                        reset();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* People List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Pessoas Cadastradas ({filteredPessoas.length})
              </CardTitle>
              <CardDescription>
                Lista de todas as pessoas cadastradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredPessoas.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa cadastrada'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPessoas.map((pessoa) => (
                    <Card key={pessoa.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900 truncate">
                              {pessoa.nome}
                            </h3>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(pessoa)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(pessoa.id)}
                                disabled={deleteMutation.isLoading}
                              >
                                <Trash2 className="h-4 w-4" />
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}