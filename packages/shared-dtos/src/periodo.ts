import { z } from 'zod';
import { CursoSchema } from './curso';
import { CurriculoSchema } from './curriculo';

export const PeriodoSchema = z.object({
  id: z.number().int().positive(),
  curriculoId: z.number().int().positive(),
  numero: z.number().int().min(1).max(255),
  nome: z.string().max(80).nullable().optional(),
  descricao: z.string().nullable().optional(),
  totalDisciplinas: z.number().int().nonnegative().optional(),
  totalAlunos: z.number().int().nonnegative().optional(),
  curso: CursoSchema.nullable().optional(),
  curriculo: CurriculoSchema.nullable().optional(),
});

export const CreatePeriodoSchema = PeriodoSchema.omit({
  id: true,
  totalDisciplinas: true,
  totalAlunos: true,
  curso: true,
}).extend({
  nome: z.string().max(80).optional(),
  descricao: z.string().optional(),
});

export const UpdatePeriodoSchema = CreatePeriodoSchema.partial();

export type Periodo = z.infer<typeof PeriodoSchema>;
export type CreatePeriodo = z.infer<typeof CreatePeriodoSchema>;
export type UpdatePeriodo = z.infer<typeof UpdatePeriodoSchema>;
