/**
 * @swagger
 * tags:
 *   - name: Avaliações
 *     description: Gestão de avaliações e notas
 */
import { Router, Request, Response } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import {
  avaliacoes,
  avaliacoesAlunos,
  turmas,
  turmasInscritos,
  alunos,
  pessoas,
} from '../db/schema';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { requireAuth, requireProfessor } from '../middleware/auth.middleware';
import {
  CreateAvaliacaoSchema,
  IdParamSchema,
} from '@seminario/shared-dtos';
import { z } from 'zod';
import { AuditService } from '../services/audit.service';
import { GradeService } from '../services/grade.service';

const router = Router();

router.use(requireAuth);

// GET /avaliacoes?turmaId=1
/**
 * @swagger
 * /api/avaliacoes:
 *   get:
 *     tags: [Avaliações]
 *     summary: Lista avaliações por turma
 *     parameters:
 *       - in: query
 *         name: turmaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da turma
 *     responses:
 *       200:
 *         description: Lista de avaliações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       turmaId: { type: integer }
 *                       data: { type: string, format: date }
 *                       tipo: { type: string, enum: [PROVA, TRABALHO, PARTICIPACAO, OUTRO] }
 *                       codigo: { type: string }
 *                       descricao: { type: string }
 *                       peso: { type: integer }
 *                       arquivoUrl: { type: string, nullable: true }
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const turmaId = Number(req.query.turmaId);
    if (!turmaId || Number.isNaN(turmaId)) {
      throw createError('turmaId is required', 400);
    }

    const data = await db
      .select()
      .from(avaliacoes)
      .where(eq(avaliacoes.turmaId, turmaId))
      .orderBy(desc(avaliacoes.data));

    res.json({ success: true, data });
  })
);

// POST /avaliacoes
/**
 * @swagger
 * /api/avaliacoes:
 *   post:
 *     tags: [Avaliações]
 *     summary: Cria nova avaliação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [turmaId, data, tipo, codigo, descricao, peso]
 *             properties:
 *               turmaId: { type: integer }
 *               data: { type: string, format: date }
 *               tipo: { type: string, enum: [PROVA, TRABALHO, PARTICIPACAO, OUTRO] }
 *               codigo: { type: string, maxLength: 8 }
 *               descricao: { type: string, maxLength: 50 }
 *               peso: { type: integer, minimum: 1 }
 *               arquivoUrl: { type: string }
 *     responses:
 *       201:
 *         description: Avaliação criada
 */
router.post(
  '/',
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const payload = CreateAvaliacaoSchema.parse(req.body);

    const [created] = await db.insert(avaliacoes).values(payload).returning();

    res.status(201).json({
      success: true,
      message: 'Avaliação criada com sucesso',
      data: created,
    });
  })
);

// GET /avaliacoes/turma/:turmaId/pesos
/**
 * @swagger
 * /api/avaliacoes/turma/{turmaId}/pesos:
 *   get:
 *     tags: [Avaliações]
 *     summary: Valida pesos das avaliações de uma turma
 *     parameters:
 *       - in: path
 *         name: turmaId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Validação dos pesos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalWeight: { type: number }
 *                     isValid: { type: boolean }
 *                     difference: { type: number }
 *                     message: { type: string }
 */
router.get(
  '/turma/:turmaId/pesos',
  asyncHandler(async (req: Request, res: Response) => {
    const turmaId = Number(req.params.turmaId);
    if (!turmaId || Number.isNaN(turmaId)) {
      throw createError('turmaId inválido', 400);
    }

    const avs = await db
      .select({ peso: avaliacoes.peso })
      .from(avaliacoes)
      .where(eq(avaliacoes.turmaId, turmaId));

    const weights = avs.map(a => Number(a.peso || 0));
    const validation = GradeService.validateWeights(weights);

    let message = '';
    if (!validation.isValid) {
      if (validation.difference > 0) {
        message = `Faltam ${validation.difference}% para completar 100%`;
      } else {
        message = `Sobram ${Math.abs(validation.difference)}% - total é ${validation.total}%`;
      }
    } else {
      message = 'Pesos estão corretos (100%)';
    }

    res.json({
      success: true,
      data: {
        totalWeight: validation.total,
        isValid: validation.isValid,
        difference: validation.difference,
        message
      }
    });
  })
);

// Schema para lançamento de notas - enhanced validation
const LancarNotasSchema = z.object({
  notas: z
    .array(
      z.object({
        alunoId: z.string().length(8),
        nota: z.number().min(0).max(10).refine(val => GradeService.validateGrade(val), {
          message: 'Nota deve estar entre 0 e 10'
        }),
        obs: z.string().optional(),
      })
    )
    .min(1),
});

// POST /avaliacoes/:id/notas
/**
 * @swagger
 * /api/avaliacoes/{id}/notas:
 *   post:
 *     tags: [Avaliações]
 *     summary: Lança notas dos alunos para uma avaliação
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notas]
 *             properties:
 *               notas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [alunoId, nota]
 *                   properties:
 *                     alunoId: { type: string, description: RA do aluno }
 *                     nota: { type: number, minimum: 0, maximum: 10 }
 *                     obs: { type: string }
 *     responses:
 *       201:
 *         description: Notas lançadas e médias recalculadas
 *       400:
 *         description: Erro de validação (pesos não somam 100% ou nota inválida)
 */
router.post(
  '/:id/notas',
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const params = IdParamSchema.parse(req.params);
    const body = LancarNotasSchema.parse(req.body);

    // Verifica avaliação e obtém turma
    const avaliacao = await db
      .select()
      .from(avaliacoes)
      .where(eq(avaliacoes.id, params.id))
      .limit(1);
    if (avaliacao.length === 0) throw createError('Avaliação não encontrada', 404);
    const turmaId = avaliacao[0].turmaId;

    // Valida pesos antes de aceitar notas
    const avs = await db
      .select({ peso: avaliacoes.peso })
      .from(avaliacoes)
      .where(eq(avaliacoes.turmaId, turmaId));
    
    const weights = avs.map(a => Number(a.peso || 0));
    const weightValidation = GradeService.validateWeights(weights);
    
    if (!weightValidation.isValid) {
      let message = 'Pesos das avaliações devem somar 100%. ';
      if (weightValidation.difference > 0) {
        message += `Faltam ${weightValidation.difference}%`;
      } else {
        message += `Sobram ${Math.abs(weightValidation.difference)}% (total: ${weightValidation.total}%)`;
      }
      throw createError(message, 400);
    }

    // Busca notas existentes para auditoria
    const alunoIds = body.notas.map((n) => n.alunoId);
    const existingGrades = await db
      .select()
      .from(avaliacoesAlunos)
      .where(
        and(
          eq(avaliacoesAlunos.avaliacaoId, params.id),
          inArray(avaliacoesAlunos.alunoId, alunoIds)
        )
      );

    const existingGradesMap = existingGrades.reduce((acc, grade) => {
      acc[grade.alunoId] = Number(grade.nota);
      return acc;
    }, {} as Record<string, number>);

    // Remove notas existentes para os alunos informados (idempotente)
    if (alunoIds.length > 0) {
      await db
        .delete(avaliacoesAlunos)
        .where(
          and(
            eq(avaliacoesAlunos.avaliacaoId, params.id),
            inArray(avaliacoesAlunos.alunoId, alunoIds)
          )
        );
    }

    // Insere novas notas com rounding adequado
    if (body.notas.length > 0) {
      await db.insert(avaliacoesAlunos).values(
        body.notas.map((n) => ({
          avaliacaoId: params.id,
          alunoId: n.alunoId,
          nota: GradeService.roundGrade(n.nota).toFixed(2), // Round with proper rule
          obs: n.obs,
        }))
      );
    }

    // Log audit for each grade change
    const userId = (req as any).user?.id || 1; // Assume user is available from auth middleware
    for (const nota of body.notas) {
      await AuditService.logGradeChange({
        userId,
        alunoId: nota.alunoId,
        avaliacaoId: params.id,
        oldGrade: existingGradesMap[nota.alunoId],
        newGrade: GradeService.roundGrade(nota.nota),
        turmaId,
      });
    }

    // Recalcula médias ponderadas por aluno para a turma
    const pesoTotal = avs.reduce((acc, a) => acc + Number(a.peso || 0), 0) || 0;

    // Para cada aluno afetado, calcula média = sum(nota * peso) / sum(peso)
    for (const ra of alunoIds) {
      const notas = await db
        .select({
          nota: avaliacoesAlunos.nota,
          peso: avaliacoes.peso,
        })
        .from(avaliacoesAlunos)
        .leftJoin(avaliacoes, eq(avaliacoesAlunos.avaliacaoId, avaliacoes.id))
        .where(and(eq(avaliacoes.turmaId, turmaId), eq(avaliacoesAlunos.alunoId, ra)));

      const grades = notas.map(n => ({
        grade: Number(n.nota || 0),
        weight: Number(n.peso || 0)
      }));

      const media = GradeService.calculateWeightedAverage(grades);

      // Atualiza turmas_inscritos.media
      await db
        .update(turmasInscritos)
        .set({ media: String(media) })
        .where(and(eq(turmasInscritos.turmaId, turmaId), eq(turmasInscritos.alunoId, ra)));
    }

    res.status(201).json({
      success: true,
      message: 'Notas lançadas e médias atualizadas com sucesso',
    });
  })
);

// GET /avaliacoes/:id/estudantes
/**
 * @swagger
 * /api/avaliacoes/{id}/estudantes:
 *   get:
 *     tags: [Avaliações]
 *     summary: Lista estudantes com suas notas para uma avaliação
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de estudantes com notas
 */
router.get(
  '/:id/estudantes',
  asyncHandler(async (req: Request, res: Response) => {
    const params = IdParamSchema.parse(req.params);

    // Verifica avaliação e obtém turma
    const avaliacao = await db
      .select()
      .from(avaliacoes)
      .where(eq(avaliacoes.id, params.id))
      .limit(1);
    if (avaliacao.length === 0) throw createError('Avaliação não encontrada', 404);
    const turmaId = avaliacao[0].turmaId;

    // Busca estudantes inscritos na turma
    const estudantes = await db
      .select({
        inscricaoId: turmasInscritos.id,
        alunoId: turmasInscritos.alunoId,
        ra: alunos.ra,
        nomeCompleto: pessoas.nomeCompleto,
        media: turmasInscritos.media,
      })
      .from(turmasInscritos)
      .leftJoin(alunos, eq(turmasInscritos.alunoId, alunos.ra))
      .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
      .where(eq(turmasInscritos.turmaId, turmaId));

    // Busca notas existentes para esta avaliação
    const notasExistentes = await db
      .select({
        alunoId: avaliacoesAlunos.alunoId,
        nota: avaliacoesAlunos.nota,
        obs: avaliacoesAlunos.obs,
      })
      .from(avaliacoesAlunos)
      .where(eq(avaliacoesAlunos.avaliacaoId, params.id));

    // Mapeia notas por alunoId
    const notasMap = notasExistentes.reduce((acc, nota) => {
      acc[nota.alunoId] = nota;
      return acc;
    }, {} as Record<string, any>);

    // Combina estudantes com suas notas
    const data = estudantes.map((estudante) => ({
      inscricaoId: estudante.inscricaoId,
      alunoId: estudante.alunoId,
      ra: estudante.ra,
      nomeCompleto: estudante.nomeCompleto,
      media: estudante.media ? Number(estudante.media) : null,
      nota: notasMap[estudante.alunoId]?.nota ? Number(notasMap[estudante.alunoId].nota) : null,
      obs: notasMap[estudante.alunoId]?.obs || null,
    }));

    res.json({ success: true, data });
  })
);

export default router;
