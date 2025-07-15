import { z } from 'zod';

export const ProfessorSchema = z.object({
  matricula: z.string().length(8, 'Matrícula deve ter 8 caracteres'),
  pessoaId: z.number().int().positive(),
  dataInicio: z.string(),
  formacaoAcad: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'INATIVO']),
});

export const CreateProfessorSchema = ProfessorSchema;

export const CreateProfessorWithUserSchema = CreateProfessorSchema.extend({
  createUser: z.boolean().default(false),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
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