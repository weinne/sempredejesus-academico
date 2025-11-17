import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { Edit, ArrowLeft } from 'lucide-react';
export default function DisciplinaViewPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: disciplina,
    isLoading,
  } = useQuery({
    queryKey: ['disciplina', id],
    queryFn: () => apiService.getDisciplina(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !disciplina) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Breadcrumb */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/disciplinas" className="ml-2">
                <Button variant="ghost" size="icon" title="Voltar">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <Badge variant={disciplina.ativo ? "default" : "secondary"}>
                    {disciplina.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <h1 className="text-2xl font-bold text-gray-900">{disciplina.nome}</h1>
                </div>
                {/* Breadcrumb */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                  <Link to="/disciplinas" className="hover:text-gray-700">Disciplinas</Link>
                  <span>/</span>
                  <span className="text-gray-900">{disciplina.nome}</span>
                </nav>
              </div>
            </div>
            <Link to={`/disciplinas/edit/${disciplina.id}`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar Disciplina
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações básicas</CardTitle>
            <CardDescription>Resumo da disciplina</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Código</dt>
                <dd className="text-base font-semibold text-slate-900">{disciplina.codigo || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Curso</dt>
                <dd className="text-base text-slate-900">{disciplina.curso?.nome || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Créditos</dt>
                <dd className="text-base text-slate-900">{disciplina.creditos}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Carga horária</dt>
                <dd className="text-base text-slate-900">{disciplina.cargaHoraria}h</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Status</dt>
                <dd>
                  <Badge variant={disciplina.ativo ? 'default' : 'secondary'}>
                    {disciplina.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {renderRichTextSection('Ementa', disciplina.ementa)}
        {renderRichTextSection('Objetivos', disciplina.objetivos)}
        {renderRichTextSection('Conteúdo Programático', disciplina.conteudoProgramatico)}
        {renderRichTextSection('Instrumentos e Critérios de Avaliação', disciplina.instrumentosEAvaliacao)}
        {renderRichTextSection('Bibliografia', disciplina.bibliografia)}

        {!disciplina.ementa &&
          !disciplina.objetivos &&
          !disciplina.conteudoProgramatico &&
          !disciplina.instrumentosEAvaliacao &&
          !disciplina.bibliografia && (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-slate-500">
                  Nenhuma informação curricular foi cadastrada para esta disciplina.
                </p>
              </CardContent>
            </Card>
          )}
      </main>
    </div>
  );
}

function renderRichTextSection(title: string, content?: string | null) {
  if (!content || !content.trim()) {
    return null;
  }

  return (
    <Card key={title}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="prose prose-sm max-w-none text-slate-700"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>
    </Card>
  );
}


