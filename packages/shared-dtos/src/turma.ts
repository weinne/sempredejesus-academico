import { z } from 'zod';

export const TurmaSchema = z.object({
  id: z.number().int().positive(),
  disciplinaId: z.number().int().positive(),
  professorId: z.string().length(8),
  semestreId: z.number().int(),
  sala: z.string().max(20).optional(),
  horario: z.string().max(50).optional(),
  secao: z.string().max(6).optional(),
});

export const CreateTurmaSchema = TurmaSchema.omit({
  id: true,
});

export const UpdateTurmaSchema = CreateTurmaSchema.partial();

export const TurmaCompletaSchema = TurmaSchema.extend({
  disciplina: z.object({
    id: z.number(),
    codigo: z.string(),
    nome: z.string(),
    creditos: z.number(),
    cargaHoraria: z.number(),
  }),
  professor: z.object({
    matricula: z.string(),
    pessoa: z.object({
      nomeCompleto: z.string(),
    }),
  }),
  semestre: z.object({
    id: z.number(),
    ano: z.number(),
    periodo: z.number(),
  }),
  inscritos: z.array(z.object({
    id: z.number(),
    aluno: z.object({
      ra: z.string(),
      pessoa: z.object({
        nomeCompleto: z.string(),
      }),
    }),
    status: z.enum(['MATRICULADO', 'CANCELADO', 'APROVADO', 'REPROVADO']),
  })).optional(),
});

export type Turma = z.infer<typeof TurmaSchema>;
export type CreateTurma = z.infer<typeof CreateTurmaSchema>;
export type UpdateTurma = z.infer<typeof UpdateTurmaSchema>;
export type TurmaCompleta = z.infer<typeof TurmaCompletaSchema>; 