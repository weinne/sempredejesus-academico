import { z } from 'zod';

export const CoorteSchema = z.object({
  id: z.number().int().positive(),
  cursoId: z.number().int().positive(),
  turnoId: z.number().int().positive(),
  curriculoId: z.number().int().positive(),
  anoIngresso: z.number().int().min(1900).max(2100),
  rotulo: z.string().min(1).max(40),
  ativo: z.boolean(),
});

export const CreateCoorteSchema = CoorteSchema.omit({ id: true });
export const UpdateCoorteSchema = CreateCoorteSchema.partial();

export type Coorte = z.infer<typeof CoorteSchema>;
export type CreateCoorte = z.infer<typeof CreateCoorteSchema>;
export type UpdateCoorte = z.infer<typeof UpdateCoorteSchema>;


