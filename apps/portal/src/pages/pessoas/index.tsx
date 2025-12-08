import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCan } from '@/lib/permissions';
import { apiService } from '@/services/api';
import { Pessoa } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { usePageHero } from '@/hooks/use-page-hero';
import { StatCard } from '@/components/ui/stats-card';
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
  Calendar,
  ArrowRight,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function PessoasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingPessoa, setDeletingPessoa] = useState<Pessoa | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);



  const canCreate = useCan('create', 'pessoas');
  const canEdit = useCan('edit', 'pessoas');
  const canDelete = useCan('delete', 'pessoas');

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

  // Configure Hero via hook
  usePageHero({
    title: "Gestão completa de pessoas",
    description: "Cadastre e gerencie todas as pessoas do sistema com suas informações pessoais e de contato.",
    backTo: "/dashboard",
    stats: [
      { value: pessoas.length, label: 'Total de Pessoas' },
      { value: pessoas.filter(p => p.sexo === 'M').length, label: 'Masculino' },
      { value: pessoas.filter(p => p.sexo === 'F').length, label: 'Feminino' },
      { value: pessoas.filter(p => p.email).length, label: 'Com Email' }
    ],
    actionLink: {
      href: '/alunos',
      label: 'Ver alunos'
    },
    actions: canCreate ? (
      <Button onClick={() => navigate('/pessoas/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Pessoa
      </Button>
    ) : undefined
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
      setIsDeleteDialogOpen(false);
      setDeletingPessoa(null);
    },
    onError: (error: any) => {
      // Verificar se é erro de restrição de FK
      if (error.response?.status === 409 || 
          error.message?.includes('foreign key') || 
          error.message?.includes('constraint') ||
          error.message?.includes('violates foreign key')) {
        toast({
          title: 'Não é possível excluir',
          description: 'Esta pessoa possui alunos, professores ou usuários relacionados. Remova primeiro os dados relacionados para poder excluir a pessoa.',
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setDeletingPessoa(null);
        return;
      }
      
      toast({
        title: 'Erro ao remover pessoa',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      setDeletingPessoa(null);
    },
  });

  // Filter pessoas by search term
  const filteredPessoas = pessoas.filter((pessoa) =>
    pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pessoa.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pessoa.cpf || '').includes(searchTerm)
  );

  // Handle delete
  const handleDelete = (pessoa: Pessoa) => {
    setDeletingPessoa(pessoa);
    setIsDeleteDialogOpen(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
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

  // Automaticamente usar cards em telas menores para evitar barra de rolagem lateral
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'card' : 'table'
  );

  useEffect(() => {
    const onResize = () => {
      // Em telas menores que 1024px, usar cards automaticamente
      if (window.innerWidth < 1024) {
        setViewMode('card');
      } else {
        // Só permitir tabela em telas grandes (>= 1024px)
        setViewMode('table');
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Filtros */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">Filtros e Busca</h2>
                <p className="text-sm text-slate-500">Encontre pessoas por nome, email ou CPF</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-600">Buscar</label>
                  <Input
                    placeholder="Busque por nome, email ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-96"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={() => setSearchTerm('')}>
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total de Pessoas"
              value={pessoas.length}
              icon={Users}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Masculino"
              value={pessoas.filter(p => p.sexo === 'M').length}
              icon={User}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Feminino"
              value={pessoas.filter(p => p.sexo === 'F').length}
              icon={User}
              iconColor="text-pink-600"
            />
            <StatCard
              title="Com Email"
              value={pessoas.filter(p => p.email).length}
              icon={Mail}
              iconColor="text-green-600"
            />
          </div>

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
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/pessoas/edit/${p.id}`)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p)}
                          title="Remover"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
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
                        {(canEdit || canDelete) && (
                          <div className="flex space-x-1">
                            {canEdit && (
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/pessoas/edit/${pessoa.id}`)} title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(pessoa)}
                                title="Remover"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
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

      {/* Dialog para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingPessoa(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a pessoa <strong>{deletingPessoa?.nome}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingPessoa(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPessoa && deleteMutation.mutate(String(deletingPessoa.id))}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}