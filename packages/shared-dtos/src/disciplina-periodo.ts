import { z } from 'zod';

export const DisciplinaPeriodoSchema = z.object({
  disciplinaId: z.number().int().positive(),
  periodoId: z.number().int().positive(),
  ordem: z.number().int().min(1).max(32767).optional(),
  obrigatoria: z.boolean().default(true),
});

export const CreateDisciplinaPeriodoSchema = DisciplinaPeriodoSchema.extend({
  obrigatoria: DisciplinaPeriodoSchema.shape.obrigatoria.optional(),
}).strict();

export const UpdateDisciplinaPeriodoSchema = z
  .object({
    ordem: DisciplinaPeriodoSchema.shape.ordem,
    obrigatoria: DisciplinaPeriodoSchema.shape.obrigatoria.optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe pelo menos um campo para atualizar',
  });

export type DisciplinaPeriodo = z.infer<typeof DisciplinaPeriodoSchema>;
export type CreateDisciplinaPeriodo = z.infer<typeof CreateDisciplinaPeriodoSchema>;
export type UpdateDisciplinaPeriodo = z.infer<typeof UpdateDisciplinaPeriodoSchema>;

