import { z } from 'zod';

export const AlunoSchema = z.object({
  ra: z.string().length(8, 'RA deve ter 8 caracteres'),
  pessoaId: z.number().int().positive(),
  cursoId: z.number().int().positive(),
  anoIngresso: z.number().int().min(1900).max(2100),
  igreja: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO']),
  coeficienteAcad: z.number().min(0).max(10).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateAlunoSchema = AlunoSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateAlunoSchema = CreateAlunoSchema.partial().omit({ ra: true });

export const AlunoComPessoaSchema = AlunoSchema.extend({
  pessoa: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    email: z.string().optional(),
    telefone: z.string().optional(),
  }),
  curso: z.object({
    id: z.number(),
    nome: z.string(),
    grau: z.string(),
  }),
});

export type Aluno = z.infer<typeof AlunoSchema>;
export type CreateAluno = z.infer<typeof CreateAlunoSchema>;
export type UpdateAluno = z.infer<typeof UpdateAlunoSchema>;
export type AlunoComPessoa = z.infer<typeof AlunoComPessoaSchema>; 