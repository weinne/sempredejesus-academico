import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export default function TurmaPrintPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: turma,
    isLoading,
  } = useQuery({
    queryKey: ['turma', id],
    queryFn: () => apiService.getTurma(Number(id!)),
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && turma) {
      // Trigger print dialog when page loads
      window.print();
    }
  }, [isLoading, turma]);

  if (isLoading || !turma) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  // Fallback logic: use turma field if exists, otherwise use disciplina field
  const ementa = turma.ementa ?? turma.disciplina?.ementa;
  const objetivos = turma.objetivos ?? turma.disciplina?.objetivos;
  const conteudoProgramatico = turma.conteudoProgramatico ?? turma.disciplina?.conteudoProgramatico;
  const instrumentosEAvaliacao = turma.instrumentosEAvaliacao ?? turma.disciplina?.instrumentosEAvaliacao;
  const bibliografia = turma.bibliografia ?? turma.disciplina?.bibliografia;

  const getDisciplinaPeriodoLabel = () => {
    if (!turma.disciplina || !Array.isArray(turma.disciplina.periodos) || turma.disciplina.periodos.length === 0) {
      return 'Nenhum período vinculado';
    }
    const vinculo = turma.disciplina.periodos[0];
    const periodo = vinculo.periodo;
    if (periodo) {
      return periodo.nome || (periodo.numero !== undefined ? `Período ${periodo.numero}` : `Período ${vinculo.periodoId}`);
    }
    return `Período ${vinculo.periodoId}`;
  };

  return (
    <div className="min-h-screen bg-white p-8 print:p-12 font-serif">
      <style>{`
        @media print {
          @page {
            margin: 2cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
        }
        .print-content {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.6;
          color: #000;
        }
        .print-content h1 {
          font-size: 24pt;
          font-weight: bold;
          margin-bottom: 12pt;
          text-align: center;
        }
        .print-content h2 {
          font-size: 18pt;
          font-weight: bold;
          margin-top: 18pt;
          margin-bottom: 12pt;
          border-bottom: 1pt solid #000;
          padding-bottom: 6pt;
        }
        .print-content h3 {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 14pt;
          margin-bottom: 8pt;
        }
        .print-content p {
          margin-bottom: 10pt;
          text-align: justify;
        }
        .print-content ul, .print-content ol {
          margin-left: 20pt;
          margin-bottom: 10pt;
        }
        .print-content li {
          margin-bottom: 6pt;
        }
        .print-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12pt;
        }
        .print-content table td {
          padding: 6pt;
          border: 1pt solid #000;
        }
        .print-content table th {
          padding: 6pt;
          border: 1pt solid #000;
          font-weight: bold;
          background-color: #f0f0f0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12pt;
          margin-bottom: 18pt;
        }
        .info-item {
          margin-bottom: 8pt;
        }
        .info-label {
          font-weight: bold;
          display: inline-block;
          min-width: 120pt;
        }
      `}</style>

      <div className="print-content">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">{turma.disciplina?.nome || 'Disciplina não informada'}</h1>
          <div className="text-lg space-y-2">
            <p><strong>Código:</strong> {turma.disciplina?.codigo || 'N/A'}</p>
            {turma.secao && <p><strong>Seção:</strong> {turma.secao}</p>}
            {turma.sala && <p><strong>Sala:</strong> {turma.sala}</p>}
            {turma.horario && <p><strong>Horário:</strong> {turma.horario}</p>}
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="mb-8">
          <h2>Informações Básicas</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Curso:</span>
              <span>{turma.disciplina?.curso?.nome || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Período:</span>
              <span>{getDisciplinaPeriodoLabel()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Créditos:</span>
              <span>{turma.disciplina?.creditos || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Carga Horária:</span>
              <span>{turma.disciplina?.cargaHoraria || 'N/A'}h</span>
            </div>
            {turma.coorte && (
              <div className="info-item">
                <span className="info-label">Coorte:</span>
                <span>{turma.coorte.rotulo}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Alunos Matriculados:</span>
              <span>{turma.totalInscritos || 0}</span>
            </div>
          </div>
        </div>

        {/* Professor */}
        {turma.professor && (
          <div className="mb-8">
            <h2>Professor Responsável</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nome:</span>
                <span>{turma.professor.pessoa?.nome || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Matrícula:</span>
                <span>{turma.professor.matricula || 'N/A'}</span>
              </div>
              {turma.professor.pessoa?.email && (
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span>{turma.professor.pessoa.email}</span>
                </div>
              )}
              {turma.professor.pessoa?.telefone && (
                <div className="info-item">
                  <span className="info-label">Telefone:</span>
                  <span>{turma.professor.pessoa.telefone}</span>
                </div>
              )}
              {turma.professor.formacaoAcad && (
                <div className="info-item col-span-2">
                  <span className="info-label">Formação Acadêmica:</span>
                  <span>{turma.professor.formacaoAcad}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plano de Ensino */}
        {(ementa || objetivos || conteudoProgramatico || instrumentosEAvaliacao || bibliografia) && (
          <div className="mb-8">
            <h2>Plano de Ensino</h2>

            {ementa && (
              <div className="mb-6">
                <h3>Ementa</h3>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: ementa }}
                />
              </div>
            )}

            {objetivos && (
              <div className="mb-6">
                <h3>Objetivos</h3>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: objetivos }}
                />
              </div>
            )}

            {conteudoProgramatico && (
              <div className="mb-6">
                <h3>Conteúdo Programático</h3>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: conteudoProgramatico }}
                />
              </div>
            )}

            {instrumentosEAvaliacao && (
              <div className="mb-6">
                <h3>Instrumentos e Critérios de Avaliação</h3>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: instrumentosEAvaliacao }}
                />
              </div>
            )}

            {bibliografia && (
              <div className="mb-6">
                <h3>Bibliografia</h3>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: bibliografia }}
                />
              </div>
            )}
          </div>
        )}

        {/* Lista de Alunos */}
        {turma.inscritos && turma.inscritos.length > 0 && (
          <div className="mb-8">
            <h2>Alunos Matriculados</h2>
            <table>
              <thead>
                <tr>
                  <th>RA</th>
                  <th>Nome</th>
                  <th>Status</th>
                  {turma.inscritos.some(i => i.media) && <th>Média</th>}
                </tr>
              </thead>
              <tbody>
                {turma.inscritos.map((inscrito) => (
                  <tr key={inscrito.id}>
                    <td>{inscrito.alunoId}</td>
                    <td>{inscrito.aluno?.pessoa?.nome || 'Nome não informado'}</td>
                    <td>{inscrito.status}</td>
                    {turma.inscritos?.some(i => i.media) && (
                      <td>{inscrito.media || '-'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-600 border-t border-gray-300 pt-4">
          <p>Documento gerado em {new Date().toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      </div>
    </div>
  );
}

