import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export default function ProfessorEditPage() {
  const { matricula } = useParams<{ matricula: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: professor, isLoading } = useQuery({
    queryKey: ['professor', matricula],
    queryFn: () => apiService.getProfessor(String(matricula!)),
    enabled: !!matricula,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiService.updateProfessor(String(matricula!), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professores'] });
      queryClient.invalidateQueries({ queryKey: ['professor', matricula] });
      toast({ title: 'Professor atualizado', description: 'Professor atualizado com sucesso!' });
      navigate('/professores');
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar professor', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const updatePessoaMutation = useMutation({
    mutationFn: (payload: any) => apiService.updatePessoa(String(professor!.pessoa!.id), payload),
    onError: (error: any) => toast({ title: 'Erro ao atualizar pessoa', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  // User related
  const { data: usersResponse } = useQuery({ queryKey: ['users'], queryFn: () => apiService.getUsers({ limit: 100 }) });
  const relatedUser = usersResponse?.data?.find((u: any) => Number(u.pessoaId) === Number(professor?.pessoaId));

  const updateUserMutation = useMutation({
    mutationFn: (payload: any) => apiService.updateUser(Number(relatedUser!.id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Usuário atualizado', description: 'Dados de usuário atualizados com sucesso!' });
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar usuário', description: error.message || 'Erro desconhecido', variant: 'destructive' }),
  });

  const pessoaSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    sexo: z.enum(['M', 'F', 'O']).optional(),
    email: z.string().email('Email inválido').optional(),
    cpf: z.string().optional(),
    telefone: z.string().optional(),
    endereco: z.string().optional(),
    data_nascimento: z.string().optional(),
  });

  const formSchema = z.object({
    dataInicio: z.string().min(1, 'Data de início é obrigatória'),
    situacao: z.enum(['ATIVO', 'INATIVO']),
    formacaoAcad: z.string().max(120).optional(),
    pessoa: pessoaSchema,
  });

  type EditFormData = z.infer<typeof formSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(formSchema),
    values: professor ? {
      dataInicio: professor.dataInicio,
      situacao: professor.situacao as 'ATIVO' | 'INATIVO',
      formacaoAcad: professor.formacaoAcad || '',
      pessoa: {
        nome: professor.pessoa?.nome || '',
        sexo: (professor.pessoa?.sexo as any) || undefined,
        email: professor.pessoa?.email || '',
        cpf: professor.pessoa?.cpf || '',
        telefone: professor.pessoa?.telefone || '',
        endereco: professor.pessoa?.endereco || '',
        data_nascimento: professor.pessoa?.data_nascimento || '',
      },
    } : undefined,
  });

  // Masks and normalization helpers
  const onlyDigits = (value: string) => value.replace(/\D/g, '');
  const maskCPF = (digits: string) => digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
  const maskPhone = (digits: string) => {
    const d = digits.slice(0, 11);
    if (d.length <= 10) {
      return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  if (isLoading || !professor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CrudHeader title="Editar Professor" backTo="/professores" />
        <div className="max-w-4xl mx-auto p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title={`Editar Professor ${professor.matricula}`} backTo="/professores" />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
              <CardDescription>Atualize informações do professor e da pessoa</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit((data) => {
                  updateMutation.mutate({
                    dataInicio: data.dataInicio,
                    formacaoAcad: data.formacaoAcad || '',
                    situacao: data.situacao,
                  });
                  if (professor.pessoa?.id) {
                    updatePessoaMutation.mutate({
                      nome: data.pessoa.nome,
                      sexo: data.pessoa.sexo,
                      email: data.pessoa.email,
                      cpf: data.pessoa.cpf,
                      telefone: data.pessoa.telefone,
                      endereco: data.pessoa.endereco,
                      data_nascimento: data.pessoa.data_nascimento,
                    });
                  }
                })}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
                  <Input type="date" {...register('dataInicio')} className={errors.dataInicio ? 'border-red-500' : ''} />
                  {errors.dataInicio && (<p className="mt-1 text-sm text-red-600">{errors.dataInicio.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Situação *</label>
                  <select {...register('situacao')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formação Acadêmica</label>
                  <Input {...register('formacaoAcad')} placeholder="Ex: Doutorado em Teologia" />
                </div>

                {/* Pessoa */}
                <div className="md:col-span-2">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                      <Input {...register('pessoa.nome')} className={errors?.pessoa?.nome ? 'border-red-500' : ''} />
                      {errors?.pessoa?.nome && (<p className="mt-1 text-sm text-red-600">{errors.pessoa.nome.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                      <select {...register('pessoa.sexo')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="O">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input type="email" {...register('pessoa.email')} className={errors?.pessoa?.email ? 'border-red-500' : ''} />
                      {errors?.pessoa?.email && (<p className="mt-1 text-sm text-red-600">{errors.pessoa.email.message}</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <Input
                      {...register('pessoa.cpf', {
                        onChange: (e) => {
                          const digits = onlyDigits(e.target.value || '');
                          e.target.value = maskCPF(digits);
                        },
                      })}
                    />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <Input
                      {...register('pessoa.telefone', {
                        onChange: (e) => {
                          const digits = onlyDigits(e.target.value || '');
                          e.target.value = maskPhone(digits);
                        },
                      })}
                    />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                      <Input type="date" {...register('pessoa.data_nascimento')} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                      <Input {...register('pessoa.endereco')} />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>Atualizar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/professores')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {relatedUser && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Dados de Usuário</CardTitle>
                <CardDescription>Atualize as informações de acesso do usuário vinculado</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget as HTMLFormElement);
                    const payload: any = {
                      username: String(fd.get('user.username') || relatedUser.username),
                      role: String(fd.get('user.role') || relatedUser.role) as Role,
                      isActive: String(fd.get('user.isActive') || relatedUser.isActive) as 'S' | 'N',
                    };
                    updateUserMutation.mutate(payload);
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <Input name="user.username" defaultValue={relatedUser.username} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
                    <select name="user.role" defaultValue={relatedUser.role} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value={Role.ADMIN}>Administrador</option>
                      <option value={Role.SECRETARIA}>Secretaria</option>
                      <option value={Role.PROFESSOR}>Professor</option>
                      <option value={Role.ALUNO}>Aluno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ativo</label>
                    <select name="user.isActive" defaultValue={relatedUser.isActive} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value="S">Sim</option>
                      <option value="N">Não</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button type="submit" disabled={updateUserMutation.isPending}>Atualizar Usuário</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}


