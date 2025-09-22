import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { Turno, Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import {
  ArrowLeft,
  Clock,
  Edit
} from 'lucide-react';

export default function TurnoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();

  const {
    data: turno,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['turno', id],
    queryFn: () => apiService.getTurnos().then(turnos => turnos.find(t => t.id === Number(id))),
    enabled: !!id,
    retry: false,
  });

  const canEdit = hasRole([Role.ADMIN, Role.SECRETARIA]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !turno) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 py-4">
              <Link to="/turnos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalhes do Turno</h1>
                <p className="text-sm text-gray-600">ID: {id}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Turno não encontrado</h2>
              <p className="text-gray-600">Não foi possível carregar os dados do turno com ID {id}.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const getTurnoColor = (nome: string) => {
    switch (nome.toUpperCase()) {
      case 'DIURNO': return 'bg-yellow-100 text-yellow-800';
      case 'VESPERTINO': return 'bg-orange-100 text-orange-800';
      case 'NOTURNO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/turnos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalhes do Turno</h1>
              <p className="text-sm text-gray-600">{turno.nome}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{turno.nome}</CardTitle>
                    <CardDescription>Informações do turno acadêmico</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTurnoColor(turno.nome)}`}>
                    {turno.nome}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com Informações Rápidas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Turno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-medium">{turno.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Nome:</span>
                    <span className="font-medium">{turno.nome}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canEdit && (
                  <Link to={`/turnos/edit/${turno.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Turno
                    </Button>
                  </Link>
                )}
                <Link to="/turnos">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Ver Todos os Turnos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}