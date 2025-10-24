import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { Pessoa, Role } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  createNewPessoa: z.boolean().default(true),
  pessoaId: z.number().min(1, 'Selecione uma pessoa').optional(),
  pessoaNome: z.string().min(2, 'Nome é obrigatório').optional(),
  pessoaSexo: z.enum(['M', 'F', 'O']).optional(),
  pessoaEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  pessoaCpf: z.string().optional(),
  pessoaTelefone: z.string().optional(),
  pessoaDataNasc: z.string().optional(),
  pessoaEndereco: z.string().optional(),
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres').max(50),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  role: z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO'], {
    required_error: 'Selecione uma role',
  }),
  isActive: z.enum(['S', 'N']).default('S'),
}).refine((data) => {
  return data.createNewPessoa ? !!data.pessoaNome && !!data.pessoaSexo : !!data.pessoaId;
}, {
  message: 'Informe os dados da nova pessoa ou selecione uma pessoa existente',
  path: ['pessoaId'],
});

type FormData = z.infer<typeof schema>;

export default function UserNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showMorePessoa, setShowMorePessoa] = useState(false);

  const { data: pessoas = [] } = useQuery({ queryKey: ['pessoas'], queryFn: apiService.getPessoas });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { createNewPessoa: true, isActive: 'S' },
  });
  const createNewPessoa = watch('createNewPessoa');
  const formatCPF = (value: string) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 11);
    const parts: string[] = [];
    if (digits.length > 3) {
      parts.push(digits.slice(0, 3));
      if (digits.length > 6) {
        parts.push(digits.slice(3, 6));
        parts.push(digits.slice(6, 9));
      } else {
        parts.push(digits.slice(3));
      }
    } else if (digits) {
      parts.push(digits);
    }
    const rest = digits.length > 9 ? '-' + digits.slice(9, 11) : '';
    return parts.length ? parts.join('.') + rest : digits;
  };

  const createUserMutation = useMutation({
    mutationFn: async (payload: any) => apiService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Usuário criado', description: 'Usuário criado com sucesso!' });
      navigate('/users');
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar usuário', description: error.message || 'Erro desconhecido', variant: 'destructive' });
    },
  });

  const onSubmit = async (data: FormData) => {
    let pessoaIdToUse: number | null = null;
    let createdPessoaId: string | null = null;
    try {
      if (data.createNewPessoa) {
        const created = await apiService.createPessoa({
          nome: data.pessoaNome || '',
          sexo: (data.pessoaSexo as any) || 'M',
          email: data.pessoaEmail || '',
          cpf: (data.pessoaCpf || '').replace(/\D/g, ''),
          telefone: data.pessoaTelefone || '',
          data_nascimento: data.pessoaDataNasc || '',
          endereco: data.pessoaEndereco || '',
          created_at: '',
          updated_at: '',
          id: '' as any,
        } as any);
        pessoaIdToUse = Number(created.id);
        createdPessoaId = created.id;
        queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      } else {
        pessoaIdToUse = Number(data.pessoaId);
      }

      await createUserMutation.mutateAsync({
        pessoaId: pessoaIdToUse!,
        username: data.username,
        password: data.password,
        role: data.role,
        isActive: data.isActive,
      });
    } catch (err: any) {
      if (createdPessoaId) {
        try { await apiService.deletePessoa(createdPessoaId); } catch {}
      }
      toast({ title: 'Erro ao cadastrar', description: err.message || 'Falha no cadastro de usuário', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader title="Novo Usuário" backTo="/users" description="Cadastro de usuário" />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input type="checkbox" {...register('createNewPessoa')} defaultChecked />
                      Cadastrar nova pessoa
                    </label>
                  </div>

                  {createNewPessoa ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Pessoa *</label>
                        <Input {...register('pessoaNome')} className={errors.pessoaNome ? 'border-red-500' : ''} />
                        {errors.pessoaNome && (<p className="mt-1 text-sm text-red-600">{errors.pessoaNome.message}</p>)}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
                        <select
                          {...register('pessoaSexo', {
                            setValueAs: (value) => (value === '' ? undefined : (value as FormData['pessoaSexo'])),
                          })}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.pessoaSexo ? 'border-red-500' : ''}`}
                          defaultValue=""
                        >
                          <option value="">Selecione...</option>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                          <option value="O">Outro</option>
                        </select>
                        {errors.pessoaSexo && (<p className="mt-1 text-sm text-red-600">{errors.pessoaSexo.message}</p>)}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Input type="email" {...register('pessoaEmail')} className={errors.pessoaEmail ? 'border-red-500' : ''} />
                        {errors.pessoaEmail && (<p className="mt-1 text-sm text-red-600">{errors.pessoaEmail.message}</p>)}
                      </div>
                      <div className="md:col-span-2">
                        <Button type="button" variant="outline" onClick={() => setShowMorePessoa(!showMorePessoa)}>
                          {showMorePessoa ? 'Ocultar campos opcionais' : 'Mostrar mais'}
                        </Button>
                      </div>
                      {showMorePessoa && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                            <Input {...register('pessoaCpf')} onChange={(e) => setValue('pessoaCpf', formatCPF(e.target.value))} placeholder="000.000.000-00" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <Input {...register('pessoaTelefone')} placeholder="(11) 99999-9999" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                            <Input type="date" {...register('pessoaDataNasc')} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                            <Input {...register('pessoaEndereco')} placeholder="Rua, número, bairro, cidade" />
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa *</label>
                      <select
                        {...register('pessoaId')}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.pessoaId ? 'border-red-500' : ''}`}
                      >
                        <option value="">Selecione uma pessoa...</option>
                        {pessoas.map((p) => (
                          <option key={p.id} value={Number(p.id)}>{p.nome} {p.email ? `(${p.email})` : ''}</option>
                        ))}
                      </select>
                      {errors.pessoaId && (<p className="mt-1 text-sm text-red-600">{errors.pessoaId.message}</p>)}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <Input {...register('username')} className={errors.username ? 'border-red-500' : ''} />
                    {errors.username && (<p className="mt-1 text-sm text-red-600">{errors.username.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                    <Input type="password" {...register('password')} className={errors.password ? 'border-red-500' : ''} />
                    {errors.password && (<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      {...register('role', {
                        setValueAs: (value) => (value === '' ? undefined : (value as FormData['role'])),
                      })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.role ? 'border-red-500' : ''}`}
                      defaultValue=""
                    >
                      <option value="">Selecione uma role...</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="SECRETARIA">Secretaria</option>
                      <option value="PROFESSOR">Professor</option>
                      <option value="ALUNO">Aluno</option>
                    </select>
                    {errors.role && (<p className="mt-1 text-sm text-red-600">{errors.role.message as any}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select {...register('isActive')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value="S">Ativo</option>
                      <option value="N">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createUserMutation.isPending}>Criar</Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/users')}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


