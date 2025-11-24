import React, { useEffect, useState, useMemo } from 'react';
import { Layers3, ListOrdered, CalendarRange, BookOpen, Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@/components/ui/date-picker';

import CrudHeader from '@/components/crud/crud-header';
import { FormSection, FieldError, ActionsBar } from '@/components/forms';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchSelect } from '@/components/form/search-select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { UpdatePeriodo, Disciplina } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
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

const schema = z.object({
  curriculoId: z.number().int().positive(),
  numero: z.number().int().min(1, 'Informe o número do período').max(255),
  nome: z.string().max(80).optional(),
  descricao: z.string().max(500).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const parseNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const PeriodoEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: periodo, isLoading } = useQuery({
    queryKey: ['periodo', id],
    queryFn: () => apiService.getPeriodo(Number(id)),
    enabled: !!id,
  });

  // Buscar disciplinas do mesmo curso
  const cursoId = periodo?.curso?.id;
  const { data: disciplinasData } = useQuery({
    queryKey: ['disciplinas', cursoId],
    queryFn: () => apiService.getDisciplinas({ cursoId: cursoId, limit: 1000 }),
    enabled: !!cursoId,
  });

  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>('');
  const [removingDisciplinaId, setRemovingDisciplinaId] = useState<number | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  // Disciplinas disponíveis para adicionar (que não estão já relacionadas)
  const disciplinasRelacionadasIds = useMemo(() => {
    return new Set((periodo?.disciplinas || []).map((d) => d.id));
  }, [periodo?.disciplinas]);

  const disciplinasDisponiveis = useMemo(() => {
    if (!disciplinasData?.data) return [];
    return disciplinasData.data.filter((d) => !disciplinasRelacionadasIds.has(d.id));
  }, [disciplinasData?.data, disciplinasRelacionadasIds]);

  const disciplinasOptions = useMemo(() => {
    return disciplinasDisponiveis.map((d) => ({
      label: `${d.codigo} - ${d.nome}`,
      value: d.id.toString(),
    }));
  }, [disciplinasDisponiveis]);

  // Mutations para gerenciar disciplinas
  const addDisciplinaMutation = useMutation({
    mutationFn: (disciplinaId: number) =>
      apiService.addDisciplinaAoPeriodo(Number(id), {
        disciplinaId,
        obrigatoria: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodo', id] });
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      setSelectedDisciplinaId('');
      toast({
        title: 'Disciplina adicionada',
        description: 'A disciplina foi relacionada ao período com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar disciplina',
        description: error.message || 'Não foi possível adicionar a disciplina ao período.',
        variant: 'destructive',
      });
    },
  });

  const removeDisciplinaMutation = useMutation({
    mutationFn: (disciplinaId: number) =>
      apiService.removeDisciplinaDoPeriodo(Number(id), disciplinaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodo', id] });
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      setIsRemoveDialogOpen(false);
      setRemovingDisciplinaId(null);
      toast({
        title: 'Disciplina removida',
        description: 'A disciplina foi removida do período com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover disciplina',
        description: error.message || 'Não foi possível remover a disciplina do período.',
        variant: 'destructive',
      });
    },
  });

  const handleAddDisciplina = () => {
    const disciplinaId = Number(selectedDisciplinaId);
    if (!disciplinaId || isNaN(disciplinaId)) {
      toast({
        title: 'Selecione uma disciplina',
        description: 'Por favor, selecione uma disciplina para adicionar.',
        variant: 'destructive',
      });
      return;
    }
    addDisciplinaMutation.mutate(disciplinaId);
  };

  const handleRemoveDisciplina = (disciplinaId: number) => {
    setRemovingDisciplinaId(disciplinaId);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveDisciplina = () => {
    if (removingDisciplinaId) {
      removeDisciplinaMutation.mutate(removingDisciplinaId);
    }
  };

  const disciplinaParaRemover = useMemo(() => {
    if (!removingDisciplinaId || !periodo?.disciplinas) return null;
    return periodo.disciplinas.find((d) => d.id === removingDisciplinaId);
  }, [removingDisciplinaId, periodo?.disciplinas]);

  useEffect(() => {
    if (periodo) {
      reset({
        curriculoId: periodo.curriculoId,
        numero: periodo.numero,
        nome: periodo.nome ?? '',
        descricao: periodo.descricao ?? '',
        dataInicio: periodo.dataInicio || '',
        dataFim: periodo.dataFim || '',
      });
    }
  }, [periodo, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePeriodo) => apiService.updatePeriodo(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      queryClient.invalidateQueries({ queryKey: ['periodo', id] });
      toast({
        title: 'Período atualizado',
        description: 'As informações do período foram salvas com sucesso.',
      });
      navigate('/periodos');
    },
    onError: (error: any) =>
      toast({
        title: 'Erro ao atualizar período',
        description: error.message || 'Não foi possível atualizar o período.',
        variant: 'destructive',
      }),
  });

  const handleFormError = () => {
    toast({
      title: 'Revise os campos destacados',
      description: 'Algumas informações obrigatórias não foram preenchidas corretamente.',
      variant: 'destructive',
    });
  };

  const onSubmit = (data: FormData) => {
    const nome = data.nome?.trim();
    const descricao = data.descricao?.trim();
    updateMutation.mutate({
      curriculoId: data.curriculoId,
      numero: data.numero,
      nome: nome || undefined,
      descricao: descricao || undefined,
      dataInicio: data.dataInicio || undefined,
      dataFim: data.dataFim || undefined,
    });
  };

  if (isLoading || !periodo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CrudHeader title="Editar Período" backTo="/periodos" />
        <div className="max-w-4xl mx-auto p-6 text-sm text-slate-600">
          Carregando informações do período...
        </div>
      </div>
    );
  }

  const cursoNome = periodo.curso?.nome ?? '—';
  const cursoGrau = periodo.curso?.grau ?? '—';
  const turnoNome = periodo.turno?.nome ?? '—';
  const curriculoVersao = periodo.curriculo?.versao ?? '—';
  const curriculoStatus = periodo.curriculo?.ativo ? 'Ativo' : 'Inativo';

  return (
    <div className="min-h-screen bg-slate-50">
      <CrudHeader
        title={`Editar Período ${periodo.nome || periodo.numero}`}
        description="Atualize as informações descritivas do período. Curso, turno e currículo não podem ser alterados."
        backTo="/periodos"
      />

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
          <input type="hidden" {...register('curriculoId', { setValueAs: parseNumber })} />

          <FormSection
            icon={Layers3}
            title="Contexto acadêmico"
            description="Informações fixas sobre onde este período está localizado."
          >
            <div data-field="curso" className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Curso
              </label>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <p className="font-medium">{cursoNome}</p>
                <p className="text-xs text-slate-500">Grau acadêmico: {cursoGrau}</p>
              </div>
            </div>

            <div data-field="turno" className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Turno
              </label>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {turnoNome}
              </div>
            </div>

            <div data-field="curriculo" className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currículo
              </label>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <p className="font-medium">Versão {curriculoVersao}</p>
                <p className="text-xs text-slate-500">Status: {curriculoStatus}</p>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={ListOrdered}
            title="Informações do período"
            description="Atualize o identificador e os detalhes descritivos."
          >
            <div data-field="numero">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número *
              </label>
              <Input
                type="number"
                min={1}
                max={255}
                {...register('numero', { setValueAs: parseNumber })}
                className={`h-11 ${errors.numero ? 'border-red-500' : ''}`}
              />
              <FieldError message={errors.numero?.message} />
            </div>

            <div className="md:col-span-2" data-field="nome">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do período (opcional)
              </label>
              <Input
                {...register('nome')}
                maxLength={80}
                placeholder="Ex: Fundamentos de Teologia"
                className={errors.nome ? 'border-red-500 h-11' : 'h-11'}
              />
              <FieldError message={errors.nome?.message} />
            </div>

            <div className="md:col-span-2" data-field="descricao">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição (opcional)
              </label>
              <Textarea
                {...register('descricao')}
                rows={5}
                placeholder="Inclua detalhes complementares sobre o período, se necessário."
                className={errors.descricao ? 'border-red-500' : ''}
              />
              <FieldError message={errors.descricao?.message} />
            </div>
          </FormSection>

          <FormSection
            icon={CalendarRange}
            title="Datas"
            description="Informe as datas previstas para o início e término do período."
          >
            <div data-field="dataInicio">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data de início
              </label>
              <Controller
                name="dataInicio"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || null}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
            </div>

            <div data-field="dataFim">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data de término
              </label>
              <Controller
                name="dataFim"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || null}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
            </div>
          </FormSection>

          <FormSection
            icon={BookOpen}
            title="Disciplinas do período"
            description="Relacione as disciplinas que compõem este período. Apenas disciplinas já cadastradas podem ser relacionadas."
          >
            <div className="md:col-span-2 space-y-4">
              {/* Seletor de disciplina para adicionar */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Adicionar disciplina
                  </label>
                  <SearchSelect
                    value={selectedDisciplinaId}
                    onChange={setSelectedDisciplinaId}
                    options={disciplinasOptions}
                    placeholder={
                      disciplinasDisponiveis.length === 0
                        ? 'Nenhuma disciplina disponível'
                        : 'Selecione uma disciplina...'
                    }
                    emptyMessage="Nenhuma disciplina disponível"
                  />
                  {disciplinasDisponiveis.length === 0 && periodo?.curso?.id && (
                    <p className="text-xs text-slate-500 mt-1">
                      Todas as disciplinas do curso já estão relacionadas, ou não há disciplinas cadastradas.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleAddDisciplina}
                  disabled={!selectedDisciplinaId || addDisciplinaMutation.isPending}
                  className="h-10"
                >
                  {addDisciplinaMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
                {periodo?.curso?.id && (
                  <Link to="/disciplinas/new" target="_blank">
                    <Button type="button" variant="outline" className="h-10" title="Cadastrar nova disciplina">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Nova
                    </Button>
                  </Link>
                )}
              </div>

              {/* Lista de disciplinas relacionadas */}
              {periodo?.disciplinas && periodo.disciplinas.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Disciplinas relacionadas ({periodo.disciplinas.length})
                  </label>
                  <div className="space-y-2">
                    {periodo.disciplinas.map((disciplina) => (
                      <Card key={disciplina.id} className="border border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-900">
                                  {disciplina.codigo} - {disciplina.nome}
                                </span>
                                {disciplina.obrigatoria !== false && (
                                  <Badge variant="default" className="text-xs">
                                    Obrigatória
                                  </Badge>
                                )}
                                {disciplina.obrigatoria === false && (
                                  <Badge variant="outline" className="text-xs">
                                    Optativa
                                  </Badge>
                                )}
                                {!disciplina.ativo && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inativa
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 space-y-0.5">
                                <div>
                                  {disciplina.creditos} créditos • {disciplina.cargaHoraria}h
                                </div>
                                {disciplina.ordem && (
                                  <div>Ordem: {disciplina.ordem}</div>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDisciplina(disciplina.id)}
                              disabled={removeDisciplinaMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Remover disciplina do período"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-300 rounded-md">
                  Nenhuma disciplina relacionada a este período.
                </div>
              )}
            </div>
          </FormSection>

          <ActionsBar
            isSubmitting={updateMutation.isPending}
            submitLabel="Salvar alterações"
            submittingLabel="Salvando..."
            cancelTo="/periodos"
          />
        </form>
      </main>

      {/* Dialog de confirmação de remoção */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover disciplina do período?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a disciplina{' '}
              <strong>
                {disciplinaParaRemover?.codigo} - {disciplinaParaRemover?.nome}
              </strong>{' '}
              deste período? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemovingDisciplinaId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveDisciplina}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeDisciplinaMutation.isPending}
            >
              {removeDisciplinaMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PeriodoEditPage;
