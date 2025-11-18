import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePicker } from '@/components/ui/date-picker';
import { User, MapPin } from 'lucide-react';

import CrudHeader from '@/components/crud/crud-header';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { useFormErrors } from '@/hooks/use-form-errors';
import { onlyDigits, maskCPF, maskPhone } from '@/lib/form-utils';

const pessoaSchema = z.object({
  nome: z.string({ message: 'Nome é obrigatório' }).min(2, 'Nome deve ter pelo menos 2 caracteres'),
  sexo: z.enum(['M', 'F', 'O'], {
    message: 'Selecione o sexo',
  }),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  cpf: z.string().optional().or(z.literal('')),
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

const parseEndereco = (raw: unknown): EnderecoForm => {
  if (!raw) return emptyEndereco;

  if (typeof raw === 'string') {
    if (!raw.trim()) return emptyEndereco;
    try {
      const parsed = JSON.parse(raw);
      return {
        logradouro: parsed?.logradouro ?? '',
        numero: parsed?.numero ?? '',
        complemento: parsed?.complemento ?? '',
        bairro: parsed?.bairro ?? '',
        cidade: parsed?.cidade ?? '',
        estado: parsed?.estado ?? '',
        cep: parsed?.cep ?? '',
      };
    } catch {
      return { ...emptyEndereco, logradouro: raw };
    }
  }

  if (typeof raw === 'object' && raw !== null) {
    const parsed = raw as Record<string, string | undefined>;
    return {
      logradouro: parsed.logradouro ?? '',
      numero: parsed.numero ?? '',
      complemento: parsed.complemento ?? '',
      bairro: parsed.bairro ?? '',
      cidade: parsed.cidade ?? '',
      estado: parsed.estado ?? '',
      cep: parsed.cep ?? '',
    };
  }

  return emptyEndereco;
};

export default function PessoaEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleFormError } = useFormErrors();

  const { data: pessoa, isLoading } = useQuery({
    queryKey: ['pessoa', id],
    queryFn: () => apiService.getPessoa(String(id!)),
    enabled: !!id,
  });

  const [endereco, setEndereco] = useState<EnderecoForm>(emptyEndereco);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PessoaFormData>({
    resolver: zodResolver(pessoaSchema),
  });

  useEffect(() => {
    if (pessoa) {
      reset({
        nome: pessoa.nome,
        sexo: pessoa.sexo || 'M',
        email: pessoa.email || '',
        cpf: pessoa.cpf || '',
        telefone: pessoa.telefone || '',
        data_nascimento: pessoa.data_nascimento || '',
      });
      setEndereco(parseEndereco(pessoa.endereco));
    }
  }, [pessoa, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiService.updatePessoa(String(id!), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['pessoa', id] });
      toast({ title: 'Pessoa atualizada', description: 'Dados atualizados com sucesso!' });
      navigate('/pessoas');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao atualizar pessoa',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      }),
  });

  const hasEndereco = Object.values(endereco).some((value) => value && value.trim().length > 0);

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
      cpf: onlyDigits(data.cpf || ''),
      telefone: onlyDigits(data.telefone || ''),
      data_nascimento: data.data_nascimento || '',
      endereco: enderecoPayload,
    };

    updateMutation.mutate(payload);
  };

  const handleEnderecoChange = (field: keyof EnderecoForm) => (value: string) => {
    setEndereco((prev) => ({
      ...prev,
      [field]: field === 'estado' ? value.toUpperCase().slice(0, 2) : value,
    }));
  };

  if (isLoading || !pessoa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <CrudHeader title="Editar Pessoa" backTo="/pessoas" />
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <p className="text-slate-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <CrudHeader title={`Editar Pessoa: ${pessoa.nome}`} backTo="/pessoas" description="Atualização de dados" />

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Editar Pessoa</h1>
            <p className="mt-1 text-sm text-slate-600">Atualize as informações da pessoa</p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
              {/* Seção 1: Dados Pessoais */}
              <FormSection
                icon={User}
                title="Dados Pessoais"
                description="Informações básicas da pessoa"
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                    <Input
                      data-field="nome"
                      {...register('nome')}
                      className={`h-11 ${errors.nome ? 'border-red-500' : ''}`}
                      placeholder="Nome completo"
                    />
                    <FieldError message={errors.nome?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
                    <select
                      data-field="sexo"
                      {...register('sexo')}
                      className={`w-full h-11 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.sexo ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="O">Outro</option>
                    </select>
                    <FieldError message={errors.sexo?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                    <Controller
                      name="data_nascimento"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value || null}
                          onChange={field.onChange}
                          placeholder="dd/mm/aaaa"
                          data-field="data_nascimento"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      data-field="email"
                      {...register('email')}
                      className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="email@exemplo.com"
                    />
                    <FieldError message={errors.email?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <Input
                      data-field="cpf"
                      {...register('cpf', {
                        onChange: (e) => {
                          const digits = onlyDigits(e.target.value || '');
                          e.target.value = maskCPF(digits);
                        },
                      })}
                      placeholder="000.000.000-00"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <Input
                      data-field="telefone"
                      {...register('telefone', {
                        onChange: (e) => {
                          const digits = onlyDigits(e.target.value || '');
                          e.target.value = maskPhone(digits);
                        },
                      })}
                      placeholder="(11) 99999-9999"
                      className="h-11"
                    />
                  </div>
                </div>
              </FormSection>

              {/* Separador */}
              <div className="border-t border-slate-200"></div>

              {/* Seção 2: Endereço */}
              <FormSection
                icon={MapPin}
                title="Endereço"
                description="Informações de localização"
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-3">
                    <Input
                      value={endereco.logradouro}
                      onChange={(e) => handleEnderecoChange('logradouro')(e.target.value)}
                      placeholder="Logradouro"
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input
                      value={endereco.numero}
                      onChange={(e) => handleEnderecoChange('numero')(e.target.value)}
                      placeholder="Número"
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      value={endereco.complemento}
                      onChange={(e) => handleEnderecoChange('complemento')(e.target.value)}
                      placeholder="Complemento"
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      value={endereco.bairro}
                      onChange={(e) => handleEnderecoChange('bairro')(e.target.value)}
                      placeholder="Bairro"
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      value={endereco.cidade}
                      onChange={(e) => handleEnderecoChange('cidade')(e.target.value)}
                      placeholder="Cidade"
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input
                      value={endereco.estado}
                      onChange={(e) => handleEnderecoChange('estado')(e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                      className="h-11"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input
                      value={endereco.cep}
                      onChange={(e) => handleEnderecoChange('cep')(e.target.value.replace(/\D/g, ''))}
                      placeholder="CEP"
                      className="h-11"
                    />
                  </div>
                </div>
              </FormSection>

              {/* Ações */}
              <ActionsBar
                submitLabel="Atualizar Pessoa"
                submittingLabel="Atualizando..."
                isSubmitting={updateMutation.isPending}
                cancelTo="/pessoas"
              />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
