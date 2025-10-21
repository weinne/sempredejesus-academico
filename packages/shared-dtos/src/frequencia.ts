import { z } from 'zod';

export const FrequenciaSchema = z.object({
  id: z.number().int().positive(),
  aulaId: z.number().int().positive(),
  inscricaoId: z.number().int().positive(),
  presente: z.boolean(),
  justificativa: z.string().optional(),
});

export const CreateFrequenciaSchema = FrequenciaSchema.omit({
  id: true,
});

export const UpdateFrequenciaSchema = CreateFrequenciaSchema.partial();

export const FrequenciaCompletaSchema = FrequenciaSchema.extend({
  aula: z.object({
    id: z.number(),
    data: z.string(),
    topico: z.string().optional(),
  }),
  inscricao: z.object({
    id: z.number(),
    aluno: z.object({
      ra: z.string(),
      pessoa: z.object({
        nomeCompleto: z.string(),
      }),
    }),
  }),
});

export type Frequencia = z.infer<typeof FrequenciaSchema>;
export type CreateFrequencia = z.infer<typeof CreateFrequenciaSchema>;
export type UpdateFrequencia = z.infer<typeof UpdateFrequenciaSchema>;
export type FrequenciaCompleta = z.infer<typeof FrequenciaCompletaSchema>;