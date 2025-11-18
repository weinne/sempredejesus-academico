/**
 * @swagger
 * tags:
 *   - name: Aulas
 *     description: Aulas e controle de frequência
 */
import { Router, Request, Response } from 'express';
import { and, desc, eq, inArray, or, gte, lte, between } from 'drizzle-orm';
import { db } from '../db';
import {
  aulas,
  frequencias as frequenciasTbl,
  turmas,
  turmasInscritos,
  alunos,
  pessoas,
  calendario,
} from '../db/schema';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { requireAuth, requireProfessor } from '../middleware/auth.middleware';
import { CreateAulaSchema, UpdateAulaSchema, AulasBatchSchema, FrequenciaBulkUpsertSchema, IdParamSchema } from '@seminario/shared-dtos';
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
 *     summary: Lista aulas por turma, disciplina ou professor
 *     parameters:
 *       - in: query
 *         name: turmaId
 *         schema: { type: integer }
 *       - in: query
 *         name: disciplinaId
 *         schema: { type: integer }
 *       - in: query
 *         name: professorId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de aulas
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const turmaId = req.query.turmaId ? Number(req.query.turmaId) : undefined;
    const disciplinaId = req.query.disciplinaId ? Number(req.query.disciplinaId) : undefined;
    const professorId = req.query.professorId ? String(req.query.professorId) : undefined;

    if (
      (!turmaId || Number.isNaN(turmaId)) &&
      (!disciplinaId || Number.isNaN(disciplinaId)) &&
      (!professorId || professorId.trim().length === 0)
    ) {
      throw createError('Informe turmaId, disciplinaId ou professorId', 400);
    }

    const query = turmaId && !Number.isNaN(turmaId)
      ? db.select({ aula: aulas }).from(aulas).where(eq(aulas.turmaId, turmaId)).orderBy(desc(aulas.data))
      : (() => {
          const baseQuery = db.select({ aula: aulas }).from(aulas).leftJoin(turmas, eq(turmas.id, aulas.turmaId)).orderBy(desc(aulas.data));
          const conditions = [] as any[];
          if (disciplinaId && !Number.isNaN(disciplinaId)) {
            conditions.push(eq(turmas.disciplinaId, disciplinaId));
          }
          if (professorId && professorId.trim().length > 0) {
            conditions.push(eq(turmas.professorId, professorId));
          }
          return conditions.length === 1 
            ? baseQuery.where(conditions[0])
            : conditions.length > 1
            ? baseQuery.where(and(...conditions))
            : baseQuery;
        })();

    const rows = await query;
    const data = rows.map((row: any) => row.aula ?? row);

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

// PUT /aulas/:id
/**
 * @swagger
 * /api/aulas/{id}:
 *   put:
 *     tags: [Aulas]
 *     summary: Atualiza uma aula existente
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
 *             properties:
 *               data: { type: string, format: date }
 *               horaInicio: { type: string }
 *               horaFim: { type: string }
 *               topico: { type: string }
 *               materialUrl: { type: string }
 *               observacao: { type: string }
 *     responses:
 *       200:
 *         description: Aula atualizada
 */
router.put(
  '/:id',
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const params = IdParamSchema.parse(req.params);
    const payload = UpdateAulaSchema.parse(req.body);

    const existing = await db.select().from(aulas).where(eq(aulas.id, params.id)).limit(1);
    if (existing.length === 0) throw createError('Aula não encontrada', 404);

    const [updated] = await db.update(aulas).set(payload).where(eq(aulas.id, params.id)).returning();

    res.json({ success: true, message: 'Aula atualizada', data: updated });
  })
);

// POST /aulas/batch
/**
 * @swagger
 * /api/aulas/batch:
 *   post:
 *     tags: [Aulas]
 *     summary: Cria aulas em lote com recorrência
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [turmaId, diaDaSemana, dataInicio, dataFim, horaInicio, horaFim]
 *             properties:
 *               turmaId: { type: integer }
 *               diaDaSemana: { type: integer, minimum: 0, maximum: 6 }
 *               dataInicio: { type: string, format: date }
 *               dataFim: { type: string, format: date }
 *               horaInicio: { type: string }
 *               horaFim: { type: string }
 *               pularFeriados: { type: boolean }
 *               dryRun: { type: boolean }
 *     responses:
 *       201:
 *         description: Aulas criadas ou preview gerado
 */
router.post(
  '/batch',
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const payload = AulasBatchSchema.parse(req.body);
    
    // Verify turma exists
    const turmaExists = await db.select().from(turmas).where(eq(turmas.id, payload.turmaId)).limit(1);
    if (turmaExists.length === 0) throw createError('Turma não encontrada', 404);

    // Generate dates for the specified day of week
    const startDate = new Date(payload.dataInicio);
    const endDate = new Date(payload.dataFim);
    
    if (startDate > endDate) {
      throw createError('Data de início deve ser anterior à data de fim', 400);
    }

    const generatedDates: string[] = [];
    const currentDate = new Date(startDate);

    // Find first occurrence of the target day
    while (currentDate.getDay() !== payload.diaDaSemana && currentDate <= endDate) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate all dates for the day of week
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      generatedDates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 7); // Next week
    }

    // Filter out holidays if requested
    let datesToCreate = [...generatedDates];
    if (payload.pularFeriados) {
      const holidays = await db
        .select()
        .from(calendario)
        .where(
          or(
            ...generatedDates.map(dateStr => 
              and(
                lte(calendario.inicio, dateStr),
                gte(calendario.termino, dateStr)
              )
            )
          )
        );

      const holidayDates = new Set<string>();
      holidays.forEach(holiday => {
        const holidayStart = new Date(holiday.inicio);
        const holidayEnd = new Date(holiday.termino);
        
        generatedDates.forEach(dateStr => {
          const date = new Date(dateStr);
          if (date >= holidayStart && date <= holidayEnd) {
            holidayDates.add(dateStr);
          }
        });
      });

      datesToCreate = generatedDates.filter(dateStr => !holidayDates.has(dateStr));
    }

    // Check for existing aulas
    const existingAulas = await db
      .select()
      .from(aulas)
      .where(
        and(
          eq(aulas.turmaId, payload.turmaId),
          inArray(aulas.data, datesToCreate)
        )
      );

    const existingDates = new Set(existingAulas.map(a => a.data));
    const newDates = datesToCreate.filter(dateStr => !existingDates.has(dateStr));

    if (payload.dryRun) {
      return res.json({
        success: true,
        data: {
          totalGeradas: newDates.length,
          existentesIgnoradas: existingDates.size,
          datas: newDates,
        },
      });
    }

    // Create aulas
    if (newDates.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhuma aula nova para criar',
        data: { criadas: [] },
      });
    }

    const aulasToInsert = newDates.map(dateStr => ({
      turmaId: payload.turmaId,
      data: dateStr,
      horaInicio: payload.horaInicio,
      horaFim: payload.horaFim,
      topico: null,
      materialUrl: null,
      observacao: null,
    }));

    const criadas = await db.insert(aulas).values(aulasToInsert).returning();

    res.status(201).json({
      success: true,
      message: `${criadas.length} aula(s) criada(s)`,
      data: { criadas },
    });
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

// POST /aulas/frequencias/bulk-upsert
/**
 * @swagger
 * /api/aulas/frequencias/bulk-upsert:
 *   post:
 *     tags: [Aulas]
 *     summary: Upsert de frequências em lote (transacional)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itens]
 *             properties:
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [aulaId, inscricaoId, presente]
 *                   properties:
 *                     aulaId: { type: integer }
 *                     inscricaoId: { type: integer }
 *                     presente: { type: boolean }
 *                     justificativa: { type: string }
 *     responses:
 *       200:
 *         description: Frequências atualizadas
 */
router.post(
  '/frequencias/bulk-upsert',
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const payload = FrequenciaBulkUpsertSchema.parse(req.body);

    // Group by aula for performance
    const aulaIds = [...new Set(payload.itens.map((item: any) => item.aulaId as number))];
    
    // Verify all aulas exist and get turmaIds
    const aulasData = await db.select().from(aulas).where(inArray(aulas.id, aulaIds as number[]));
    if (aulasData.length !== aulaIds.length) {
      throw createError('Uma ou mais aulas não encontradas', 404);
    }

    const aulaToTurmaMap = aulasData.reduce((acc, aula) => {
      acc[aula.id] = aula.turmaId;
      return acc;
    }, {} as Record<number, number>);

    // Process in transaction
    await db.transaction(async (tx) => {
      // Get existing frequencies for audit
      const existingFreqs = await tx
        .select()
        .from(frequenciasTbl)
        .where(
          or(
            ...payload.itens.map((item: any) => 
              and(
                eq(frequenciasTbl.aulaId, item.aulaId as number),
                eq(frequenciasTbl.inscricaoId, item.inscricaoId as number)
              )
            )
          )
        );

      const existingMap = existingFreqs.reduce((acc, freq) => {
        const key = `${freq.aulaId}-${freq.inscricaoId}`;
        acc[key] = freq;
        return acc;
      }, {} as Record<string, any>);

      // Delete existing records
      for (const item of payload.itens) {
        await tx
          .delete(frequenciasTbl)
          .where(
            and(
              eq(frequenciasTbl.aulaId, item.aulaId),
              eq(frequenciasTbl.inscricaoId, item.inscricaoId)
            )
          );
      }

      // Insert new/updated records
      if (payload.itens.length > 0) {
        await tx.insert(frequenciasTbl).values(
          payload.itens.map((item: any) => ({
            aulaId: item.aulaId,
            inscricaoId: item.inscricaoId,
            presente: item.presente,
            justificativa: item.justificativa || null,
          }))
        );
      }

      // Audit log
      const userId = (req as any).user?.id || 1;
      for (const item of payload.itens) {
        const key = `${item.aulaId}-${item.inscricaoId}`;
        const existing = existingMap[key];
        
        if (!existing || existing.presente !== item.presente) {
          const inscricao = await tx
            .select({ alunoId: turmasInscritos.alunoId })
            .from(turmasInscritos)
            .where(eq(turmasInscritos.id, item.inscricaoId))
            .limit(1);
          
          if (inscricao.length > 0) {
            await AuditService.logAttendanceChange({
              userId,
              alunoId: inscricao[0].alunoId,
              aulaId: item.aulaId,
              oldPresence: existing?.presente,
              newPresence: item.presente,
              turmaId: aulaToTurmaMap[item.aulaId],
            });
          }
        }
      }

      // Recalculate attendance percentages
      const inscricaoIds = [...new Set(payload.itens.map((item: any) => item.inscricaoId as number))];
      
      for (const inscricaoId of inscricaoIds) {
        const inscricao = await tx
          .select()
          .from(turmasInscritos)
          .where(eq(turmasInscritos.id, inscricaoId as number))
          .limit(1);
        
        if (inscricao.length === 0) continue;
        
        const turmaId = inscricao[0].turmaId;
        
        // Get total aulas for this turma
        const totalAulas = await tx.select({ c: aulas.id }).from(aulas).where(eq(aulas.turmaId, turmaId));
        const total = totalAulas.length || 0;
        
        if (total > 0) {
          // Count present
          const presentes = await tx
            .select({ c: frequenciasTbl.id })
            .from(frequenciasTbl)
            .leftJoin(aulas, eq(frequenciasTbl.aulaId, aulas.id))
            .where(
              and(
                eq(aulas.turmaId, turmaId as number),
                eq(frequenciasTbl.inscricaoId, inscricaoId as number),
                eq(frequenciasTbl.presente, true)
              )
            );

          const ausencias = total - presentes.length;
          const attendancePercentage = AttendanceService.calculateAttendancePercentage(total, ausencias);

          await tx
            .update(turmasInscritos)
            .set({ frequencia: String(attendancePercentage) })
            .where(eq(turmasInscritos.id, inscricaoId as number));
        }
      }
    });

    res.json({ success: true, message: 'Frequências atualizadas em lote' });
  })
);

export default router;
