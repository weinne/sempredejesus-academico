/**
 * @swagger
 * tags:
 *   - name: Aulas
 *     description: Aulas e controle de frequência
 */
import { Router, Request, Response } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { aulas, frequencias as frequenciasTbl, turmas, turmasInscritos, alunos, pessoas } from '../db/schema';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { requireAuth, requireProfessor } from '../middleware/auth.middleware';
import { CreateAulaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { z } from 'zod';
import { AuditService } from '../services/audit.service';
import { AttendanceService } from '../services/attendance.service';

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

    // Busca frequências existentes para auditoria
    const inscricaoIds = body.frequencias.map((f) => f.inscricaoId);
    const existingFrequencies = await db
      .select()
      .from(frequenciasTbl)
      .where(and(eq(frequenciasTbl.aulaId, params.id), inArray(frequenciasTbl.inscricaoId, inscricaoIds)));

    const existingFreqMap = existingFrequencies.reduce((acc, freq) => {
      acc[freq.inscricaoId] = freq.presente;
      return acc;
    }, {} as Record<number, boolean>);

    // Limpa registros anteriores para os inscritos informados (idempotente)
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

    // Log audit for attendance changes
    const userId = (req as any).user?.id || 1; // Assume user is available from auth middleware
    for (const freq of body.frequencias) {
      const inscricao = await db
        .select({ alunoId: turmasInscritos.alunoId })
        .from(turmasInscritos)
        .where(eq(turmasInscritos.id, freq.inscricaoId))
        .limit(1);
      
      if (inscricao.length > 0) {
        await AuditService.logAttendanceChange({
          userId,
          alunoId: inscricao[0].alunoId,
          aulaId: params.id,
          oldPresence: existingFreqMap[freq.inscricaoId],
          newPresence: freq.presente,
          turmaId,
        });
      }
    }

    // Recalcula % de frequência por inscrição usando AttendanceService
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

        const ausencias = total - presentes.length;
        const attendancePercentage = AttendanceService.calculateAttendancePercentage(total, ausencias);

        await db
          .update(turmasInscritos)
          .set({ frequencia: String(attendancePercentage) })
          .where(eq(turmasInscritos.id, idIns));
      }
    }

    res.status(201).json({ success: true, message: 'Frequências registradas e % atualizada' });
  })
);

// GET /aulas/:id/estudantes
/**
 * @swagger
 * /api/aulas/{id}/estudantes:
 *   get:
 *     tags: [Aulas]
 *     summary: Lista estudantes inscritos na turma da aula
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de estudantes com frequências atuais da aula
 */
router.get(
  '/:id/estudantes',
  asyncHandler(async (req: Request, res: Response) => {
    const params = IdParamSchema.parse(req.params);

    // Verifica aula e obtém turma
    const aula = await db.select().from(aulas).where(eq(aulas.id, params.id)).limit(1);
    if (aula.length === 0) throw createError('Aula não encontrada', 404);
    const turmaId = aula[0].turmaId;

    // Busca estudantes inscritos na turma
    const estudantes = await db
      .select({
        inscricaoId: turmasInscritos.id,
        alunoId: turmasInscritos.alunoId,
        ra: alunos.ra,
        nomeCompleto: pessoas.nomeCompleto,
      })
      .from(turmasInscritos)
      .leftJoin(alunos, eq(turmasInscritos.alunoId, alunos.ra))
      .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
      .where(eq(turmasInscritos.turmaId, turmaId));

    // Busca frequências existentes para esta aula
    const frequenciasExistentes = await db
      .select({
        inscricaoId: frequenciasTbl.inscricaoId,
        presente: frequenciasTbl.presente,
        justificativa: frequenciasTbl.justificativa,
      })
      .from(frequenciasTbl)
      .where(eq(frequenciasTbl.aulaId, params.id));

    // Mapeia frequências por inscricaoId
    const frequenciasMap = frequenciasExistentes.reduce((acc, freq) => {
      acc[freq.inscricaoId] = freq;
      return acc;
    }, {} as Record<number, any>);

    // Combina estudantes com suas frequências
    const data = estudantes.map((estudante) => ({
      inscricaoId: estudante.inscricaoId,
      alunoId: estudante.alunoId,
      ra: estudante.ra,
      nomeCompleto: estudante.nomeCompleto,
      presente: frequenciasMap[estudante.inscricaoId]?.presente ?? true, // Default: presente
      justificativa: frequenciasMap[estudante.inscricaoId]?.justificativa || null,
    }));

    res.json({ success: true, data });
  })
);

// GET /aulas/turma/:turmaId/alertas-frequencia
/**
 * @swagger
 * /api/aulas/turma/{turmaId}/alertas-frequencia:
 *   get:
 *     tags: [Aulas]
 *     summary: Lista alertas de frequência para uma turma
 *     parameters:
 *       - in: path
 *         name: turmaId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de alertas de frequência
 */
router.get(
  '/turma/:turmaId/alertas-frequencia',
  asyncHandler(async (req: Request, res: Response) => {
    const turmaId = Number(req.params.turmaId);
    if (!turmaId || Number.isNaN(turmaId)) {
      throw createError('turmaId inválido', 400);
    }

    // Busca total de aulas da turma
    const totalAulas = await db.select({ c: aulas.id }).from(aulas).where(eq(aulas.turmaId, turmaId));
    const total = totalAulas.length || 0;

    // Busca estudantes inscritos na turma
    const estudantes = await db
      .select({
        inscricaoId: turmasInscritos.id,
        alunoId: turmasInscritos.alunoId,
        ra: alunos.ra,
        nomeCompleto: pessoas.nomeCompleto,
        frequencia: turmasInscritos.frequencia,
      })
      .from(turmasInscritos)
      .leftJoin(alunos, eq(turmasInscritos.alunoId, alunos.ra))
      .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
      .where(eq(turmasInscritos.turmaId, turmaId));

    // Calcula alertas para cada estudante
    const alertas = [];
    for (const estudante of estudantes) {
      const attendancePercentage = Number(estudante.frequencia || 100);
      const absencePercentage = 100 - attendancePercentage;
      const absences = Math.round((absencePercentage / 100) * total);

      const attendanceStatus = AttendanceService.getAttendanceStatus(total, absences);

      if (attendanceStatus.needsAlert) {
        alertas.push({
          inscricaoId: estudante.inscricaoId,
          alunoId: estudante.alunoId,
          ra: estudante.ra,
          nomeCompleto: estudante.nomeCompleto,
          totalAulas: total,
          ausencias: absences,
          percentualFaltas: attendanceStatus.absencePercentage,
          percentualFrequencia: attendanceStatus.attendancePercentage,
          nivel: attendanceStatus.alertLevel,
          mensagem: attendanceStatus.alertMessage,
        });
      }
    }

    res.json({ 
      success: true, 
      data: {
        turmaId,
        totalAulas: total,
        alertas
      }
    });
  })
);

export default router;
