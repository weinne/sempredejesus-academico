import { z } from 'zod';

export const DisciplinaSchema = z.object({
  id: z.number().int().positive(),
  cursoId: z.number().int().positive(),
  periodoId: z.number().int().positive().nullable(),
  codigo: z.string().max(10),
  nome: z.string().max(120),
  creditos: z.number().int().min(1).max(32767),
  cargaHoraria: z.number().int().min(1),
  ementa: z.string().optional(),
  bibliografia: z.string().optional(),
  ativo: z.boolean().default(true),
});

export const CreateDisciplinaSchema = DisciplinaSchema.omit({
  id: true,
});

export const UpdateDisciplinaSchema = CreateDisciplinaSchema.partial();

export const DisciplinaComCursoSchema = DisciplinaSchema.extend({
  curso: z.object({
    id: z.number(),
    nome: z.string(),
    grau: z.string(),
  }),
  periodo: z.object({
    id: z.number(),
    numero: z.number(),
    nome: z.string().nullable(),
  }).optional(),
});

export type Disciplina = z.infer<typeof DisciplinaSchema>;
export type CreateDisciplina = z.infer<typeof CreateDisciplinaSchema>;
export type UpdateDisciplina = z.infer<typeof UpdateDisciplinaSchema>;
export type DisciplinaComCurso = z.infer<typeof DisciplinaComCursoSchema>; 