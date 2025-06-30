import { z } from 'zod';

export const AvaliacaoSchema = z.object({
  id: z.number().int().positive(),
  turmaId: z.number().int().positive(),
  data: z.string().date(),
  tipo: z.enum(['PROVA', 'TRABALHO', 'PARTICIPACAO', 'OUTRO']),
  codigo: z.string().max(8),
  descricao: z.string().max(50),
  peso: z.number().int().min(1).max(32767),
  arquivoUrl: z.string().url().optional(),
});

export const CreateAvaliacaoSchema = AvaliacaoSchema.omit({
  id: true,
});

export const UpdateAvaliacaoSchema = CreateAvaliacaoSchema.partial();

export const AvaliacaoAlunoSchema = z.object({
  id: z.number().int().positive(),
  avaliacaoId: z.number().int().positive(),
  alunoId: z.string().length(8),
  nota: z.number().min(0).max(10),
  obs: z.string().optional(),
});

export const CreateAvaliacaoAlunoSchema = AvaliacaoAlunoSchema.omit({
  id: true,
});

export const UpdateAvaliacaoAlunoSchema = CreateAvaliacaoAlunoSchema.partial();

export const AvaliacaoComNotasSchema = AvaliacaoSchema.extend({
  notas: z.array(z.object({
    id: z.number(),
    alunoId: z.string(),
    nota: z.number(),
    obs: z.string().optional(),
    aluno: z.object({
      ra: z.string(),
      pessoa: z.object({
        nomeCompleto: z.string(),
      }),
    }),
  })),
});

export type Avaliacao = z.infer<typeof AvaliacaoSchema>;
export type CreateAvaliacao = z.infer<typeof CreateAvaliacaoSchema>;
export type UpdateAvaliacao = z.infer<typeof UpdateAvaliacaoSchema>;
export type AvaliacaoAluno = z.infer<typeof AvaliacaoAlunoSchema>;
export type CreateAvaliacaoAluno = z.infer<typeof CreateAvaliacaoAlunoSchema>;
export type UpdateAvaliacaoAluno = z.infer<typeof UpdateAvaliacaoAlunoSchema>;
export type AvaliacaoComNotas = z.infer<typeof AvaliacaoComNotasSchema>; 