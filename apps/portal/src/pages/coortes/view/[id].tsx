import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { Coorte, Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import {
  ArrowLeft,
  Users,
  Edit,
  GraduationCap,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function CoorteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();

  const {
    data: coorte,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['coorte', id],
    queryFn: () => apiService.getCoorte(Number(id)),
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

  if (error || !coorte) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 py-4">
              <Link to="/coortes">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalhes da Coorte</h1>
                <p className="text-sm text-gray-600">ID: {id}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Coorte não encontrada</h2>
              <p className="text-gray-600">Não foi possível carregar os dados da coorte com ID {id}.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/coortes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalhes da Coorte</h1>
              <p className="text-sm text-gray-600">{coorte.rotulo}</p>
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
                  <div className="p-2 bg-green-100 rounded-full">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{coorte.rotulo}</CardTitle>
                    <CardDescription>Informações da coorte acadêmica</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {coorte.ativo ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Curso:</span>
                      <p className="text-sm">{coorte.curso?.nome || '—'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Turno:</span>
                      <p className="text-sm">{coorte.turno?.nome || '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Ano de Ingresso:</span>
                      <p className="text-sm">{coorte.anoIngresso}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Currículo:</span>
                      <p className="text-sm">{coorte.curriculo?.versao || '—'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com Informações Rápidas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Coorte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-medium">{coorte.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rótulo:</span>
                    <span className="font-medium">{coorte.rotulo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Curso:</span>
                    <span className="font-medium">{coorte.curso?.nome || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Turno:</span>
                    <span className="font-medium">{coorte.turno?.nome || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ano de Ingresso:</span>
                    <span className="font-medium">{coorte.anoIngresso}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Currículo:</span>
                    <span className="font-medium">{coorte.curriculo?.versao || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${coorte.ativo ? 'text-green-600' : 'text-gray-500'}`}>
                      {coorte.ativo ? 'Ativo' : 'Inativo'}
                    </span>
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
                  <Link to={`/coortes/edit/${coorte.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Coorte
                    </Button>
                  </Link>
                )}
                {canEdit && (
                  <Link to={`/coortes/vincular/${coorte.id}`}>
                    <Button className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Vincular Alunos
                    </Button>
                  </Link>
                )}
                <Link to="/coortes">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Todas as Coortes
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
