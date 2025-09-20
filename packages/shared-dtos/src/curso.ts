import { z } from 'zod';

export const CursoSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(2).max(80),
  grau: z.string().max(30),
});

export const CreateCursoSchema = CursoSchema.omit({
  id: true,
});

export const UpdateCursoSchema = CreateCursoSchema.partial();

export const CursoComDisciplinasSchema = CursoSchema.extend({
  disciplinas: z.array(z.object({
    id: z.number(),
    codigo: z.string(),
    nome: z.string(),
    creditos: z.number(),
    cargaHoraria: z.number(),
    ativo: z.boolean(),
  })),
  periodos: z
    .array(
      z.object({
        id: z.number(),
        numero: z.number(),
        nome: z.string().nullable(),
        descricao: z.string().nullable().optional(),
        totalDisciplinas: z.number().optional(),
      })
    )
    .optional(),
});

export type Curso = z.infer<typeof CursoSchema>;
export type CreateCurso = z.infer<typeof CreateCursoSchema>;
export type UpdateCurso = z.infer<typeof UpdateCursoSchema>;
export type CursoComDisciplinas = z.infer<typeof CursoComDisciplinasSchema>; 