import { z } from 'zod';

export const CalendarioSchema = z.object({
  id: z.number().int().positive(),
  semestreId: z.number().int(),
  evento: z.string().max(100),
  inicio: z.string().date(),
  termino: z.string().date(),
  obs: z.string().optional(),
});

export const CreateCalendarioSchema = CalendarioSchema.omit({
  id: true,
});

export const UpdateCalendarioSchema = CreateCalendarioSchema.partial();

export const CalendarioComSemestreSchema = CalendarioSchema.extend({
  semestre: z.object({
    id: z.number(),
    ano: z.number(),
    periodo: z.number(),
  }),
});

export const ConfiguracaoSchema = z.object({
  chave: z.string(),
  valor: z.unknown(),
});

export const CreateConfiguracaoSchema = ConfiguracaoSchema;

export const UpdateConfiguracaoSchema = ConfiguracaoSchema.partial().omit({ chave: true });

export type Calendario = z.infer<typeof CalendarioSchema>;
export type CreateCalendario = z.infer<typeof CreateCalendarioSchema>;
export type UpdateCalendario = z.infer<typeof UpdateCalendarioSchema>;
export type CalendarioComSemestre = z.infer<typeof CalendarioComSemestreSchema>;
export type Configuracao = z.infer<typeof ConfiguracaoSchema>;
export type CreateConfiguracao = z.infer<typeof CreateConfiguracaoSchema>;
export type UpdateConfiguracao = z.infer<typeof UpdateConfiguracaoSchema>; 