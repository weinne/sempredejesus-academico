import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { usePageHero } from '@/hooks/use-page-hero';
import { StatCard } from '@/components/ui/stats-card';
import { ArrowLeft, Settings, Shield, Database, Users, BarChart3, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Role } from '@/types/api';

export default function ConfigPage() {
  const { hasRole } = useAuth();

  if (!hasRole(Role.ADMIN)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
            <p className="text-gray-600">Apenas administradores podem acessar as configurações.</p>
            <Link to="/dashboard" className="mt-4 inline-block">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Configure Hero via hook
  usePageHero({
    title: "Controle total do sistema",
    description: "Configure e gerencie todas as configurações do sistema, segurança e parâmetros.",
    backTo: "/dashboard",
    stats: [
      { value: 'Admin', label: 'Acesso' },
      { value: '100%', label: 'Segurança' },
      { value: 'Real-time', label: 'Monitoramento' },
      { value: 'Backup', label: 'Proteção' }
    ],
    actionLink: {
      href: '/dashboard',
      label: 'Ver dashboard'
    }
  });

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard
            title="Acesso"
            value="Admin"
            icon={Shield}
            iconColor="text-red-600"
          />
          <StatCard
            title="Segurança"
            value="100%"
            icon={CheckCircle}
            iconColor="text-green-600"
          />
          <StatCard
            title="Monitoramento"
            value="Real-time"
            icon={BarChart3}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Proteção"
            value="Backup"
            icon={Database}
            iconColor="text-purple-600"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Configurações do Sistema
            </CardTitle>
            <CardDescription>
              Funcionalidade em desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Módulo de configurações será implementado em breve</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}