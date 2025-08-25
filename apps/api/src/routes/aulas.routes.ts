/**
 * @swagger
 * tags:
 *   - name: Aulas
 *     description: Aulas e controle de frequência
 */
import { Router, Request, Response } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { aulas, frequencias as frequenciasTbl, turmas, turmasInscritos } from '../db/schema';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { requireAuth, requireProfessor } from '../middleware/auth.middleware';
import { CreateAulaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { z } from 'zod';

const router = Router();

router.use(requireAuth);

// GET /aulas?turmaId=1
/**
 * @swagger
 * /api/aulas:
 *   get:
 *     tags: [Aulas]
 *     summary: Lista aulas por turma
 *     parameters:
 *       - in: query
 *         name: turmaId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de aulas
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
      .from(aulas)
      .where(eq(aulas.turmaId, turmaId))
      .orderBy(desc(aulas.data));

    res.json({ success: true, data });
  })
);

// POST /aulas
/**
 * @swagger
 * /api/aulas:
 *   post:
 *     tags: [Aulas]
 *     summary: Cria nova aula
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [turmaId, data]
 *             properties:
 *               turmaId: { type: integer }
 *               data: { type: string, format: date }
 *               topico: { type: string }
 *               materialUrl: { type: string }
 *               observacao: { type: string }
 *     responses:
 *       201:
 *         description: Aula criada
 */
router.post(
  '/',
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const payload = CreateAulaSchema.parse(req.body);

    const [created] = await db.insert(aulas).values(payload).returning();

    res.status(201).json({ success: true, message: 'Aula criada', data: created });
  })
);

// POST /aulas/:id/frequencias
/**
 * @swagger
 * /api/aulas/{id}/frequencias:
 *   post:
 *     tags: [Aulas]
 *     summary: Registra frequências de uma aula
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
 *             required: [frequencias]
 *             properties:
 *               frequencias:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [inscricaoId, presente]
 *                   properties:
 *                     inscricaoId: { type: integer }
 *                     presente: { type: boolean }
 *                     justificativa: { type: string }
 *     responses:
 *       201:
 *         description: Frequências salvas e percentual atualizado
 */
const LancarFrequenciasSchema = z.object({
  frequencias: z
    .array(
      z.object({
        inscricaoId: z.number().int().positive(),
        presente: z.boolean(),
        justificativa: z.string().optional(),
      })
    )
    .min(1),
});

router.post(
  '/:id/frequencias',
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const params = IdParamSchema.parse(req.params);
    const body = LancarFrequenciasSchema.parse(req.body);

    // Verifica aula e obtém turma
    const aula = await db.select().from(aulas).where(eq(aulas.id, params.id)).limit(1);
    if (aula.length === 0) throw createError('Aula não encontrada', 404);
    const turmaId = aula[0].turmaId;

    // Limpa registros anteriores para os inscritos informados (idempotente)
    const inscricaoIds = body.frequencias.map((f) => f.inscricaoId);
    await db
      .delete(frequenciasTbl)
      .where(and(eq(frequenciasTbl.aulaId, params.id), inArray(frequenciasTbl.inscricaoId, inscricaoIds)));

    // Insere frequências
    await db.insert(frequenciasTbl).values(
      body.frequencias.map((f) => ({
        aulaId: params.id,
        inscricaoId: f.inscricaoId,
        presente: f.presente,
        justificativa: f.justificativa,
      }))
    );

    // Recalcula % de frequência por inscrição (presentes / total de aulas da turma * 100)
    const totalAulas = await db.select({ c: aulas.id }).from(aulas).where(eq(aulas.turmaId, turmaId));
    const total = totalAulas.length || 0;

    if (total > 0) {
      // Para cada inscrição afetada
      for (const idIns of inscricaoIds) {
        const presentes = await db
          .select({ c: frequenciasTbl.id })
          .from(frequenciasTbl)
          .leftJoin(aulas, eq(frequenciasTbl.aulaId, aulas.id))
          .where(and(eq(aulas.turmaId, turmaId), eq(frequenciasTbl.inscricaoId, idIns), eq(frequenciasTbl.presente, true)));

        const perc = Math.round((presentes.length / total) * 10000) / 100; // 2 casas

        await db
          .update(turmasInscritos)
          .set({ frequencia: String(perc) })
          .where(eq(turmasInscritos.id, idIns));
      }
    }

    res.status(201).json({ success: true, message: 'Frequências registradas e % atualizada' });
  })
);

export default router;
