import { z } from 'zod';

export const TurnoSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(2).max(30), // Diurno, Vespertino, Noturno
});

export const CreateTurnoSchema = TurnoSchema.omit({ id: true });
export const UpdateTurnoSchema = CreateTurnoSchema.partial();

export type Turno = z.infer<typeof TurnoSchema>;
export type CreateTurno = z.infer<typeof CreateTurnoSchema>;
export type UpdateTurno = z.infer<typeof UpdateTurnoSchema>;


