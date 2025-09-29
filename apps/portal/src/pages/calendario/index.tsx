import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { apiService } from '@/services/api';
import { CalendarioItem, CreateCalendarioItem, Role, Periodo } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { HeroSection } from '@/components/ui/hero-section';
import { StatCard } from '@/components/ui/stats-card';
import { ArrowLeft, Plus, Trash2, Calendar, Clock, CheckCircle, XCircle, Users, ArrowRight } from 'lucide-react';

export default function CalendarioPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  const [novo, setNovo] = useState<Partial<CreateCalendarioItem>>({});

  const { data: eventos = [] } = useQuery({
    queryKey: ['calendario'],
    queryFn: () => apiService.getCalendario(),
  });

  const { data: periodosResponse } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiService.getPeriodos({ limit: 200 }),
  });
  const periodos = periodosResponse?.data || [];

  const criar = useMutation({
    mutationFn: (payload: CreateCalendarioItem) => apiService.createCalendario(payload),
    onSuccess: () => { toast({ title: 'Evento criado' }); queryClient.invalidateQueries({ queryKey: ['calendario'] }); setNovo({}); },
    onError: (e: any) => toast({ title: 'Erro ao criar', description: e.message, variant: 'destructive' }),
  });

  const remover = useMutation({
    mutationFn: (id: number) => apiService.deleteCalendario(id),
    onSuccess: () => { toast({ title: 'Evento removido' }); queryClient.invalidateQueries({ queryKey: ['calendario'] }); },
    onError: (e: any) => toast({ title: 'Erro ao remover', description: e.message, variant: 'destructive' }),
  });

  const handleCreate = () => {
    if (!canEdit) return;
    const payload: CreateCalendarioItem = {
      evento: String(novo.evento || ''),
      inicio: String(novo.inicio || ''),
      termino: String(novo.termino || ''),
      periodoId: novo.periodoId,
      obs: (novo as any).obs || undefined,
    } as any;
    criar.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button></Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendário Acadêmico</h1>
              <p className="text-sm text-gray-600">Eventos, prazos e feriados</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        badge="Calendário Acadêmico"
        title="Gestão de eventos e prazos"
        description="Organize e gerencie todos os eventos acadêmicos, prazos e feriados do sistema."
        stats={[
          { value: eventos.length, label: 'Total de Eventos' },
          { value: periodos.length, label: 'Períodos' },
          { value: eventos.filter(e => new Date(e.inicio) > new Date()).length, label: 'Próximos' },
          { value: eventos.filter(e => new Date(e.termino) < new Date()).length, label: 'Concluídos' }
        ]}
        actionLink={{
          href: '/periodos',
          label: 'Ver períodos'
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Novo Evento</CardTitle>
              <CardDescription>Adicionar item ao calendário</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <Input placeholder="Evento" value={novo.evento || ''} onChange={e=>setNovo(v=>({...v, evento: e.target.value}))} />
              <Input type="date" placeholder="Início" value={novo.inicio as any || ''} onChange={e=>setNovo(v=>({...v, inicio: e.target.value}))} />
              <Input type="date" placeholder="Término" value={novo.termino as any || ''} onChange={e=>setNovo(v=>({...v, termino: e.target.value}))} />
              <select
                value={novo.periodoId || ''}
                onChange={e=>setNovo(v=>({...v, periodoId: e.target.value ? Number(e.target.value) : undefined}))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Período (opcional)</option>
                {periodos.map((p: Periodo) => (
                  <option key={p.id} value={p.id}>
                    {p.nome || `Período ${p.numero}`} - {p.curso?.nome}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-end"><Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2"/>Criar</Button></div>
              <Input className="md:col-span-6" placeholder="Observação (opcional)" value={(novo as any).obs || ''} onChange={e=>setNovo(v=>({...v, obs: e.target.value as any}))} />
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total de Eventos"
            value={eventos.length}
            icon={Calendar}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Períodos"
            value={periodos.length}
            icon={Clock}
            iconColor="text-green-600"
          />
          <StatCard
            title="Próximos"
            value={eventos.filter(e => new Date(e.inicio) > new Date()).length}
            icon={CheckCircle}
            iconColor="text-yellow-600"
          />
          <StatCard
            title="Concluídos"
            value={eventos.filter(e => new Date(e.termino) < new Date()).length}
            icon={XCircle}
            iconColor="text-gray-600"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Eventos</CardTitle>
            <CardDescription>{eventos.length} itens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Evento</th>
                    <th className="py-2 pr-4">Início</th>
                    <th className="py-2 pr-4">Término</th>
                    <th className="py-2 pr-4">Obs</th>
                    {canEdit && <th className="py-2 pr-4">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {eventos.map(ev => (
                    <tr key={ev.id} className="border-b">
                      <td className="py-2 pr-4">{ev.evento}</td>
                      <td className="py-2 pr-4">{ev.inicio}</td>
                      <td className="py-2 pr-4">{ev.termino}</td>
                      <td className="py-2 pr-4">{ev.obs || '-'}</td>
                      {canEdit && (
                        <td className="py-2 pr-4">
                          <Button variant="destructive" size="sm" onClick={() => remover.mutate(ev.id)}><Trash2 className="h-4 w-4 mr-2"/>Remover</Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

