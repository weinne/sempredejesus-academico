import { z } from 'zod';
import { CreateAlunoWithUserSchema } from './aluno';
import { CreateProfessorWithUserSchema } from './professor';

const SourceIdSchema = z.union([z.string(), z.number()]).transform((value) => String(value));

export const DirectusAlunoImportItemSchema = CreateAlunoWithUserSchema.and(
  z.object({
    sourceId: SourceIdSchema,
  })
);

export const DirectusAlunoImportSchema = z.object({
  items: z.array(DirectusAlunoImportItemSchema).min(1).max(50),
});

export const DirectusProfessorImportItemSchema = CreateProfessorWithUserSchema.and(
  z.object({
    sourceId: SourceIdSchema,
  })
);

export const DirectusProfessorImportSchema = z.object({
  items: z.array(DirectusProfessorImportItemSchema).min(1).max(50),
});

export type DirectusAlunoImportItem = z.infer<typeof DirectusAlunoImportItemSchema>;
export type DirectusProfessorImportItem = z.infer<typeof DirectusProfessorImportItemSchema>;
export type DirectusAlunoImportPayload = z.infer<typeof DirectusAlunoImportSchema>;
export type DirectusProfessorImportPayload = z.infer<typeof DirectusProfessorImportSchema>;
