import { z } from 'zod';

export const CurriculoSchema = z.object({
  id: z.number().int().positive(),
  cursoId: z.number().int().positive(),
  turnoId: z.number().int().positive(),
  versao: z.string().min(1).max(40),
  vigenteDe: z.string().optional(),
  vigenteAte: z.string().optional(),
  ativo: z.boolean(),
});

export const CreateCurriculoSchema = CurriculoSchema.omit({ id: true });
export const UpdateCurriculoSchema = CreateCurriculoSchema.partial();

export type Curriculo = z.infer<typeof CurriculoSchema>;
export type CreateCurriculo = z.infer<typeof CreateCurriculoSchema>;
export type UpdateCurriculo = z.infer<typeof UpdateCurriculoSchema>;


