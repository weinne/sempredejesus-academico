import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { apiService } from '@/services/api';

export default function ProfessoresPage() {
  const {
    data: professores = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['professores'],
    queryFn: apiService.getProfessores,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Professores</h1>
              <p className="text-sm text-gray-600">Lista de professores cadastrados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Professores Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Erro ao carregar professores</p>
              </div>
            ) : professores.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum professor encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {professores.map((professor) => (
                  <Card key={professor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">
                          {professor.pessoa?.nome || 'Nome não informado'}
                        </h3>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Matrícula:</strong> {professor.matricula}</p>
                        <p><strong>Status:</strong> {professor.status}</p>
                        {professor.especialidade && (
                          <p><strong>Especialidade:</strong> {professor.especialidade}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}