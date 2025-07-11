import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AlunoDetailPage() {
  const { ra } = useParams<{ ra: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <Link to="/alunos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalhes do Aluno</h1>
              <p className="text-sm text-gray-600">RA: {ra}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Aluno</CardTitle>
            <CardDescription>
              Detalhes completos do aluno com RA {ra}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}