import { z } from 'zod';

// HH:mm format validation
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const AulaSchema = z.object({
  id: z.number().int().positive(),
  turmaId: z.number().int().positive(),
  data: z.string(),
  horaInicio: z.string().regex(timeRegex, 'Formato inválido (HH:mm)').nullable().optional(),
  horaFim: z.string().regex(timeRegex, 'Formato inválido (HH:mm)').nullable().optional(),
  topico: z.string().nullable().optional(),
  materialUrl: z.string().url().nullable().optional().or(z.literal('')),
  observacao: z.string().nullable().optional(),
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

// Batch creation schema
export const AulasBatchSchema = z.object({
  turmaId: z.number().int().positive(),
  diaDaSemana: z.number().int().min(0).max(6), // 0=Dom, 6=Sab
  dataInicio: z.string(), // YYYY-MM-DD
  dataFim: z.string(), // YYYY-MM-DD
  horaInicio: z.string().regex(timeRegex, 'Formato inválido (HH:mm)'),
  horaFim: z.string().regex(timeRegex, 'Formato inválido (HH:mm)'),
  pularFeriados: z.boolean().optional().default(false),
  dryRun: z.boolean().optional().default(false),
});

export const AulasBatchResponseSchema = z.object({
  totalGeradas: z.number(),
  existentesIgnoradas: z.number().optional(),
  datas: z.array(z.string()).optional(),
  criadas: z.array(AulaSchema).optional(),
});

export type Aula = z.infer<typeof AulaSchema>;
export type CreateAula = z.infer<typeof CreateAulaSchema>;
export type UpdateAula = z.infer<typeof UpdateAulaSchema>;
export type AulaComFrequencia = z.infer<typeof AulaComFrequenciaSchema>;
export type AulasBatch = z.infer<typeof AulasBatchSchema>;
export type AulasBatchResponse = z.infer<typeof AulasBatchResponseSchema>; 