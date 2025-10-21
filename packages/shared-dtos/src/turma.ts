import { z } from 'zod';

export const TurmaInscricaoStatusSchema = z.enum(['MATRICULADO', 'CANCELADO', 'APROVADO', 'REPROVADO']);

const PessoaResumoSchema = z.object({
  id: z.number().int(),
  nomeCompleto: z.string(),
  email: z.string().email().nullable().optional(),
  telefone: z.string().nullable().optional(),
});

const ProfessorResumoSchema = z.object({
  matricula: z.string(),
  pessoaId: z.number().int(),
  formacaoAcad: z.string().nullable().optional(),
  situacao: z.enum(['ATIVO', 'INATIVO']).optional(),
  pessoa: PessoaResumoSchema.nullable().optional(),
});

const DisciplinaResumoSchema = z.object({
  id: z.number().int(),
  codigo: z.string(),
  nome: z.string(),
  creditos: z.number().int().optional(),
  cargaHoraria: z.number().int().optional(),
  periodoId: z.number().int().nullable().optional(),
  cursoId: z.number().int().optional(),
  periodo: z
    .object({
      id: z.number().int(),
      numero: z.number().nullable().optional(),
      nome: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const CoorteResumoSchema = z
  .object({
    id: z.number().int(),
    rotulo: z.string(),
    anoIngresso: z.number().int(),
    ativo: z.boolean(),
  })
  .nullable()
  .optional();

const OptionalDecimalSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return Number(value);
  })
  .nullable();

export const TurmaSchema = z.object({
  id: z.number().int().positive(),
  disciplinaId: z.number().int().positive(),
  professorId: z.string().length(8),
  coorteId: z.number().int().optional(),
  sala: z.string().max(20).optional(),
  horario: z.string().max(50).optional(),
  secao: z.string().max(6).optional(),
  totalInscritos: z.number().int().nonnegative().optional(),
});

export const CreateTurmaSchema = TurmaSchema.omit({
  id: true,
});

export const UpdateTurmaSchema = CreateTurmaSchema.partial();

export const TurmaInscritoSchema = z.object({
  id: z.number().int(),
  turmaId: z.number().int(),
  alunoId: z.string(),
  media: OptionalDecimalSchema,
  frequencia: OptionalDecimalSchema,
  status: TurmaInscricaoStatusSchema,
  aluno: z
    .object({
      ra: z.string(),
      pessoaId: z.number().int().optional(),
      pessoa: PessoaResumoSchema.nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const TurmaCompletaSchema = TurmaSchema.extend({
  disciplina: DisciplinaResumoSchema.nullable().optional(),
  professor: ProfessorResumoSchema.nullable().optional(),
  coorte: CoorteResumoSchema,
  inscritos: z.array(TurmaInscritoSchema).optional(),
});

export const CreateTurmaInscricaoSchema = z.object({
  alunoId: z.string().length(8),
  status: TurmaInscricaoStatusSchema.optional(),
});

export const BulkTurmaInscricaoSchema = z
  .object({
    alunoIds: z.array(z.string().length(8)).optional(),
    coorteId: z.number().int().positive().optional(),
    status: TurmaInscricaoStatusSchema.optional(),
  })
  .refine(
    (data) => !!(data.alunoIds && data.alunoIds.length) || typeof data.coorteId === 'number',
    {
      message: 'Informe alunoIds ou coorteId',
      path: ['alunoIds'],
    },
  );

export const UpdateTurmaInscricaoSchema = z.object({
  status: TurmaInscricaoStatusSchema.optional(),
});

export type Turma = z.infer<typeof TurmaSchema>;
export type CreateTurma = z.infer<typeof CreateTurmaSchema>;
export type UpdateTurma = z.infer<typeof UpdateTurmaSchema>;
export type TurmaCompleta = z.infer<typeof TurmaCompletaSchema>;
export type TurmaInscrito = z.infer<typeof TurmaInscritoSchema>;
export type CreateTurmaInscricao = z.infer<typeof CreateTurmaInscricaoSchema>;
export type BulkTurmaInscricao = z.infer<typeof BulkTurmaInscricaoSchema>;
export type UpdateTurmaInscricao = z.infer<typeof UpdateTurmaInscricaoSchema>;