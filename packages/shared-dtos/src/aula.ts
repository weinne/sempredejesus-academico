import { z } from 'zod';

export const AulaSchema = z.object({
  id: z.number().int().positive(),
  turmaId: z.number().int().positive(),
  data: z.string().date(),
  topico: z.string().optional(),
  materialUrl: z.string().url().optional(),
  observacao: z.string().optional(),
});

export const CreateAulaSchema = AulaSchema.omit({
  id: true,
});

export const UpdateAulaSchema = CreateAulaSchema.partial();

export const AulaComFrequenciaSchema = AulaSchema.extend({
  frequencias: z.array(z.object({
    id: z.number(),
    inscricaoId: z.number(),
    presente: z.boolean(),
    justificativa: z.string().optional(),
    aluno: z.object({
      ra: z.string(),
      pessoa: z.object({
        nomeCompleto: z.string(),
      }),
    }),
  })),
});

export type Aula = z.infer<typeof AulaSchema>;
export type CreateAula = z.infer<typeof CreateAulaSchema>;
export type UpdateAula = z.infer<typeof UpdateAulaSchema>;
export type AulaComFrequencia = z.infer<typeof AulaComFrequenciaSchema>; 