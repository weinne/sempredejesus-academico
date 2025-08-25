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

// Schema para lançamento de notas
const LancarNotasSchema = z.object({
  notas: z
    .array(
      z.object({
        alunoId: z.string().length(8),
        nota: z.number().min(0).max(10),
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

    // Remove notas existentes para os alunos informados (idempotente)
    const alunoIds = body.notas.map((n) => n.alunoId);
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

    // Insere novas notas
    if (body.notas.length > 0) {
      await db.insert(avaliacoesAlunos).values(
        body.notas.map((n) => ({
          avaliacaoId: params.id,
          alunoId: n.alunoId,
          nota: n.nota.toFixed(2),
          obs: n.obs,
        }))
      );
    }

    // Recalcula médias ponderadas por aluno para a turma
    // Busca pesos das avaliações da turma
    const avs = await db
      .select({ id: avaliacoes.id, peso: avaliacoes.peso })
      .from(avaliacoes)
      .where(eq(avaliacoes.turmaId, turmaId));
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

      const soma = notas.reduce(
        (acc, n) => acc + Number(n.nota || 0) * Number(n.peso || 0),
        0
      );
      const media = pesoTotal > 0 ? Number((soma / pesoTotal).toFixed(1)) : null;

      // Atualiza turmas_inscritos.media
      await db
        .update(turmasInscritos)
        .set({ media: media !== null ? String(media) : null })
        .where(and(eq(turmasInscritos.turmaId, turmaId), eq(turmasInscritos.alunoId, ra)));
    }

    res.status(201).json({
      success: true,
      message: 'Notas lançadas e médias atualizadas',
    });
  })
);

export default router;
