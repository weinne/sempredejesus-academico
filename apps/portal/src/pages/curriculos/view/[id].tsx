import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { Curriculo, Role } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import {
  ArrowLeft,
  FileText,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function CurriculoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();

  const {
    data: curriculo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['curriculo', id],
    queryFn: () => apiService.getCurriculos().then(curriculos => curriculos.find(c => c.id === Number(id))),
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

  if (error || !curriculo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 py-4">
              <Link to="/curriculos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalhes do Currículo</h1>
                <p className="text-sm text-gray-600">ID: {id}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Currículo não encontrado</h2>
              <p className="text-gray-600">Não foi possível carregar os dados do currículo com ID {id}.</p>
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
            <Link to="/curriculos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalhes do Currículo</h1>
              <p className="text-sm text-gray-600">{curriculo.versao}</p>
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
                  <div className="p-2 bg-purple-100 rounded-full">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{curriculo.versao}</CardTitle>
                    <CardDescription>Informações do currículo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {curriculo.ativo ? (
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
                      <p className="text-sm">{curriculo.curso?.nome || '—'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Turno:</span>
                      <p className="text-sm">{curriculo.turno?.nome || '—'}</p>
                    </div>
                  </div>
                  {(curriculo.vigenteDe || curriculo.vigenteAte) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Vigência (início):</span>
                        <p className="text-sm">{curriculo.vigenteDe || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Vigência (término):</span>
                        <p className="text-sm">{curriculo.vigenteAte || '—'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com Informações Rápidas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Currículo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-medium">{curriculo.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Versão:</span>
                    <span className="font-medium">{curriculo.versao}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Curso:</span>
                    <span className="font-medium">{curriculo.curso?.nome || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Turno:</span>
                    <span className="font-medium">{curriculo.turno?.nome || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${curriculo.ativo ? 'text-green-600' : 'text-gray-500'}`}>
                      {curriculo.ativo ? 'Ativo' : 'Inativo'}
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
                  <Link to={`/curriculos/edit/${curriculo.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Currículo
                    </Button>
                  </Link>
                )}
                <Link to="/curriculos">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Todos os Currículos
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
