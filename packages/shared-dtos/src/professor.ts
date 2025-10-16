import { z } from 'zod';
import { CreatePessoaSchema } from './pessoa';

export const ProfessorSchema = z.object({
  matricula: z.string().length(8, 'Matrícula deve ter 8 caracteres'),
  pessoaId: z.number().int().positive(),
  dataInicio: z.string(),
  formacaoAcad: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'INATIVO']),
});

export const CreateProfessorSchema = ProfessorSchema;

const InlinePessoaSchema = CreatePessoaSchema.extend({
  sexo: CreatePessoaSchema.shape.sexo.optional(),
});

export const CreateProfessorWithUserSchema = CreateProfessorSchema.extend({
  pessoaId: ProfessorSchema.shape.pessoaId.optional(),
  pessoa: InlinePessoaSchema.optional(),
  createUser: z.boolean().default(false),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
}).superRefine((data, ctx) => {
  const hasPessoaId = typeof data.pessoaId === 'number' && Number.isFinite(data.pessoaId) && data.pessoaId > 0;
  const hasPessoa = !!data.pessoa;

  if (!hasPessoaId && !hasPessoa) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pessoaId'],
      message: 'Informe pessoaId ou objeto pessoa',
    });
  }

  if (hasPessoaId && hasPessoa) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pessoa'],
      message: 'Forneça pessoaId ou objeto pessoa, não ambos',
    });
  }

  if (data.createUser) {
    if (!data.username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['username'],
        message: 'Username é obrigatório quando createUser é verdadeiro',
      });
    }
    if (!data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Senha é obrigatória quando createUser é verdadeiro',
      });
    }
  }
});

export const UpdateProfessorSchema = CreateProfessorSchema.partial().omit({ matricula: true });

export const ProfessorComPessoaSchema = ProfessorSchema.extend({
  pessoa: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    email: z.string().optional(),
    telefone: z.string().optional(),
  }),
});

export type Professor = z.infer<typeof ProfessorSchema>;
export type CreateProfessor = z.infer<typeof CreateProfessorSchema>;
export type CreateProfessorWithUser = z.infer<typeof CreateProfessorWithUserSchema>;
export type UpdateProfessor = z.infer<typeof UpdateProfessorSchema>;
export type ProfessorComPessoa = z.infer<typeof ProfessorComPessoaSchema>; 