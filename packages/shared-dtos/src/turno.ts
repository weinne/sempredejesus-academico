import { z } from 'zod';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const TurnoHorarioSchema = z
  .object({
    id: z.string().min(1).optional(),
    ordem: z.number().int().nonnegative().optional(),
    descricao: z.string().min(1).max(80).optional(),
    horaInicio: z.string().regex(timeRegex, 'Horário inválido (HH:mm)'),
    horaFim: z.string().regex(timeRegex, 'Horário inválido (HH:mm)'),
  })
  .refine(
    (value) => {
      if (!value.horaInicio || !value.horaFim) return true;
      return value.horaInicio < value.horaFim;
    },
    {
      message: 'horaFim deve ser maior que horaInicio',
      path: ['horaFim'],
    },
  );

export const TurnoSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(2).max(30), // Diurno, Vespertino, Noturno
  horarios: z.array(TurnoHorarioSchema).default([]),
});

export const CreateTurnoSchema = TurnoSchema.omit({ id: true });
export const UpdateTurnoSchema = CreateTurnoSchema.partial();

export type TurnoHorario = z.infer<typeof TurnoHorarioSchema>;
export type Turno = z.infer<typeof TurnoSchema>;
export type CreateTurno = z.infer<typeof CreateTurnoSchema>;
export type UpdateTurno = z.infer<typeof UpdateTurnoSchema>;

