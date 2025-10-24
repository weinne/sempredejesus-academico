import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudHeader from '@/components/crud/crud-header';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

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
  if (!raw) {
    return emptyEndereco;
  }

  if (typeof raw === 'string') {
    if (!raw.trim()) {
      return emptyEndereco;
    }

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
      return {
        ...emptyEndereco,
        logradouro: raw,
      };
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

  const { data: pessoa, isLoading } = useQuery({
    queryKey: ['pessoa', id],
    queryFn: () => apiService.getPessoa(String(id!)),
    enabled: !!id,
  });

  const [endereco, setEndereco] = useState<EnderecoForm>(emptyEndereco);

  React.useEffect(() => {
    if (pessoa?.endereco) {
      setEndereco(parseEndereco(pessoa.endereco));
    } else {
      setEndereco(emptyEndereco);
    }
  }, [pessoa]);

  const hasEndereco = useMemo(
    () => Object.values(endereco).some((value) => value && value.trim().length > 0),
    [endereco]
  );

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

                  updateMutation.mutate({
                    nome: String(fd.get('nome') || pessoa.nome),
                    sexo: String(fd.get('sexo') || pessoa.sexo || ''),
                    email: String(fd.get('email') || pessoa.email || ''),
                    cpf: String(fd.get('cpf') || pessoa.cpf || ''),
                    telefone: String(fd.get('telefone') || pessoa.telefone || ''),
                    endereco: enderecoPayload,
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
                    <option value="O">Outro</option>
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Logradouro</label>
                      <Input
                        value={endereco.logradouro}
                        onChange={(e) =>
                          setEndereco((prev) => ({ ...prev, logradouro: e.target.value }))
                        }
                        placeholder="Rua"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                      <Input
                        value={endereco.numero}
                        onChange={(e) =>
                          setEndereco((prev) => ({ ...prev, numero: e.target.value }))
                        }
                        placeholder="123"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                      <Input
                        value={endereco.complemento}
                        onChange={(e) =>
                          setEndereco((prev) => ({ ...prev, complemento: e.target.value }))
                        }
                        placeholder="Apto, bloco, etc"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                      <Input
                        value={endereco.bairro}
                        onChange={(e) =>
                          setEndereco((prev) => ({ ...prev, bairro: e.target.value }))
                        }
                        placeholder="Bairro"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                      <Input
                        value={endereco.cidade}
                        onChange={(e) =>
                          setEndereco((prev) => ({ ...prev, cidade: e.target.value }))
                        }
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                      <Input
                        value={endereco.estado}
                        onChange={(e) =>
                          setEndereco((prev) => ({ ...prev, estado: e.target.value.toUpperCase().slice(0, 2) }))
                        }
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
                      <Input
                        value={endereco.cep}
                        onChange={(e) =>
                          setEndereco((prev) => ({ ...prev, cep: e.target.value.replace(/\D/g, '') }))
                        }
                        placeholder="00000000"
                      />
                    </div>
                  </div>
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


