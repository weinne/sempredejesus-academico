import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import CrudHeader from '@/components/crud/crud-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

const pessoaSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  sexo: z.enum(['M', 'F', 'O'], { required_error: 'Selecione o sexo' }),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  cpf: z
    .string()
    .optional()
    .or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
});

type PessoaFormData = z.infer<typeof pessoaSchema>;

interface EnderecoForm {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

const emptyEndereco: EnderecoForm = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
};

export default function PessoaNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [endereco, setEndereco] = useState<EnderecoForm>(emptyEndereco);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PessoaFormData>({
    resolver: zodResolver(pessoaSchema),
    defaultValues: {
      nome: '',
      sexo: 'M',
      email: '',
      cpf: '',
      telefone: '',
      data_nascimento: '',
    },
  });

  const createPessoaMutation = useMutation({
    mutationFn: apiService.createPessoa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      toast({
        title: 'Pessoa criada',
        description: 'Pessoa cadastrada com sucesso!',
      });
      navigate('/pessoas');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar pessoa',
        description: error?.message || 'Não foi possível criar a pessoa',
        variant: 'destructive',
      });
    },
  });

  const hasEndereco = useMemo(
    () => Object.values(endereco).some((value) => value && value.trim().length > 0),
    [endereco]
  );

  const onSubmit = (data: PessoaFormData) => {
    const enderecoPayload = hasEndereco
      ? JSON.stringify({
          logradouro: endereco.logradouro || '',
          numero: endereco.numero || '',
          complemento: endereco.complemento || '',
          bairro: endereco.bairro || '',
          cidade: endereco.cidade || '',
          estado: endereco.estado || '',
          cep: endereco.cep || '',
        })
      : '';

    const payload = {
      nome: data.nome,
      sexo: data.sexo,
      email: data.email?.trim() || '',
      cpf: (data.cpf || '').replace(/\D/g, ''),
      telefone: data.telefone?.trim() || '',
      data_nascimento: data.data_nascimento || '',
      endereco: enderecoPayload,
    } as const;

    return createPessoaMutation.mutate(payload);
  };

  const handleEnderecoChange = (field: keyof EnderecoForm) => (value: string) => {
    setEndereco((prev) => ({
      ...prev,
      [field]: field === 'estado' ? value.toUpperCase().slice(0, 2) : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CrudHeader
        title="Nova Pessoa"
        description="Cadastre os dados da pessoa"
        backTo="/pessoas"
      />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Pessoa</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <Input {...register('nome')} className={errors.nome ? 'border-red-500' : ''} />
                  {errors.nome && (
                    <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
                  <select
                    {...register('sexo')}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.sexo ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </select>
                  {errors.sexo && (
                    <p className="mt-1 text-sm text-red-600">{errors.sexo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <Input type="date" {...register('data_nascimento')} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <Input {...register('cpf')} placeholder="000.000.000-00" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <Input {...register('telefone')} placeholder="(00) 00000-0000" />
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Logradouro</label>
                      <Input
                        value={endereco.logradouro}
                        onChange={(e) => handleEnderecoChange('logradouro')(e.target.value)}
                        placeholder="Rua"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                      <Input
                        value={endereco.numero}
                        onChange={(e) => handleEnderecoChange('numero')(e.target.value)}
                        placeholder="123"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                      <Input
                        value={endereco.complemento}
                        onChange={(e) => handleEnderecoChange('complemento')(e.target.value)}
                        placeholder="Apto, bloco, etc"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                      <Input
                        value={endereco.bairro}
                        onChange={(e) => handleEnderecoChange('bairro')(e.target.value)}
                        placeholder="Bairro"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                      <Input
                        value={endereco.cidade}
                        onChange={(e) => handleEnderecoChange('cidade')(e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                      <Input
                        value={endereco.estado}
                        onChange={(e) => handleEnderecoChange('estado')(e.target.value)}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
                      <Input
                        value={endereco.cep}
                        onChange={(e) => handleEnderecoChange('cep')(e.target.value.replace(/\D/g, ''))}
                        placeholder="00000000"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={isSubmitting || createPessoaMutation.isPending}>
                    Criar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/pessoas')}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

