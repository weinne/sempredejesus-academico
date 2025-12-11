import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { usePageHero } from '@/hooks/use-page-hero';
import { StatCard } from '@/components/ui/stats-card';
import { Shield, Database, BarChart3, CheckCircle } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Role } from '@/types/api';
import { DirectusImportPanel } from './components/directus-import-panel';

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

        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div>
            <DirectusImportPanel />
          </div>

          <div className="space-y-4">
            <Card className="border-l-4 border-l-indigo-500 bg-white">
              <CardHeader>
                <CardTitle className="text-base">Checklist rápido</CardTitle>
                <CardDescription>Confirme se os serviços críticos estão saudáveis antes de importar dados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex items-center justify-between">
                  <span>API do portal</span>
                  <span className="text-green-600 font-semibold">operacional</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Banco de dados</span>
                  <span className="text-green-600 font-semibold">conectado</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Directus CMS</span>
                  <span className="text-slate-500">aguardando teste</span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white">
              <CardHeader>
                <CardTitle>Documentação rápida</CardTitle>
                <CardDescription className="text-slate-200">Links úteis para revisar credenciais e fluxos de deploy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <a href="/docs/documentacao-api" className="block underline-offset-2 hover:underline">
                  Guia da API (Swagger)
                </a>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}