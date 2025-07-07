import { z } from 'zod';

export const ProfessorSchema = z.object({
  matricula: z.string().length(8, 'Matrícula deve ter 8 caracteres'),
  pessoaId: z.number().int().positive(),
  dataInicio: z.string(),
  formacaoAcad: z.string().max(120).optional(),
  situacao: z.enum(['ATIVO', 'INATIVO']),
});

export const CreateProfessorSchema = ProfessorSchema;

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
export type UpdateProfessor = z.infer<typeof UpdateProfessorSchema>;
export type ProfessorComPessoa = z.infer<typeof ProfessorComPessoaSchema>; 