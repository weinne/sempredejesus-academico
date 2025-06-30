import { z } from 'zod';

export const SemestreSchema = z.object({
  id: z.number().int(),
  ano: z.number().int().min(1900).max(2100),
  periodo: z.number().int().min(1).max(2),
  inicio: z.string().date(),
  termino: z.string().date(),
});

export const CreateSemestreSchema = SemestreSchema.omit({
  id: true,
});

export const UpdateSemestreSchema = CreateSemestreSchema.partial();

export type Semestre = z.infer<typeof SemestreSchema>;
export type CreateSemestre = z.infer<typeof CreateSemestreSchema>;
export type UpdateSemestre = z.infer<typeof UpdateSemestreSchema>; 