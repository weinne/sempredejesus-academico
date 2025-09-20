import { z } from 'zod';

export const CalendarioSchema = z.object({
  id: z.number().int().positive(),
  evento: z.string().max(100),
  inicio: z.string(),
  termino: z.string(),
  obs: z.string().optional(),
  periodoId: z.number().int().optional(),
});

export const CreateCalendarioSchema = CalendarioSchema.omit({
  id: true,
});

export const UpdateCalendarioSchema = CreateCalendarioSchema.partial();

// Semestre relacionado removido do modelo

export const ConfiguracaoSchema = z.object({
  chave: z.string(),
  valor: z.unknown(),
});

export const CreateConfiguracaoSchema = ConfiguracaoSchema;

export const UpdateConfiguracaoSchema = ConfiguracaoSchema.partial().omit({ chave: true });

export type Calendario = z.infer<typeof CalendarioSchema>;
export type CreateCalendario = z.infer<typeof CreateCalendarioSchema>;
export type UpdateCalendario = z.infer<typeof UpdateCalendarioSchema>;
export type Configuracao = z.infer<typeof ConfiguracaoSchema>;
export type CreateConfiguracao = z.infer<typeof CreateConfiguracaoSchema>;
export type UpdateConfiguracao = z.infer<typeof UpdateConfiguracaoSchema>; 