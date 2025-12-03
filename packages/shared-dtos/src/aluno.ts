import { z } from 'zod';
import { CreatePessoaSchema } from './pessoa';

export const AlunoSchema = z.object({
  ra: z.string().length(8, 'RA deve ter 8 caracteres'),
  pessoaId: z.number().int().positive(),
  cursoId: z.number().int().positive(),
  coorteId: z.number().int().positive().nullable(),
  periodoId: z.number().int().positive().nullable(),
  turnoId: z.number().int().positive().nullable(),
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
}).extend({
  ra: z.string().max(8).optional(),
});

export const CreateAlunoWithUserSchema = CreateAlunoSchema.extend({
  // Allow either linking an existing pessoa by ID or creating an inline pessoa
  pessoaId: z.number().int().positive().optional(),
  pessoa: CreatePessoaSchema.optional(),

  createUser: z.boolean().default(false),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
}).superRefine((data, ctx) => {
  const hasPessoaId = typeof data.pessoaId === 'number';
  const hasPessoaObj = !!data.pessoa;
  if (!hasPessoaId && !hasPessoaObj) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe pessoaId ou pessoa', path: ['pessoa'] });
  }
  if (hasPessoaId && hasPessoaObj) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Forneça apenas pessoaId ou pessoa, não ambos', path: ['pessoa'] });
  }
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
  periodo: z.object({
    id: z.number(),
    numero: z.number(),
    nome: z.string().nullable(),
  }).optional(),
});

export type Aluno = z.infer<typeof AlunoSchema>;
export type CreateAluno = z.infer<typeof CreateAlunoSchema>;
export type CreateAlunoWithUser = z.infer<typeof CreateAlunoWithUserSchema>;
export type UpdateAluno = z.infer<typeof UpdateAlunoSchema>;
export type AlunoComPessoa = z.infer<typeof AlunoComPessoaSchema>; 