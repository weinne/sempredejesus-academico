import { Router, Request, Response } from 'express';
import { EnhancedCrudFactory } from '../core/crud.factory.enhanced';
import { disciplinas, cursos, periodos, disciplinasPeriodos, curriculos } from '../db/schema';
import {
  CreateDisciplinaSchema,
  UpdateDisciplinaSchema,
  IdParamSchema,
  CreateDisciplinaPeriodoSchema,
  UpdateDisciplinaPeriodoSchema,
} from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { and, eq, or, like, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     Disciplina:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da disciplina
 *         nome:
 *           type: string
 *           description: Nome da disciplina
 *           example: "Teologia Sistemática I"
 *         codigo:
 *           type: string
 *           description: Código da disciplina
 *           example: "TSI001"
 *         cargaHoraria:
 *           type: integer
 *           description: Carga horária da disciplina
 *           example: 60
 *         cursoId:
 *           type: integer
 *           description: ID do curso ao qual pertence
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateDisciplina:
 *       type: object
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome da disciplina
 *           example: "Teologia Sistemática I"
 *         codigo:
 *           type: string
 *           description: Código único da disciplina
 *           example: "TSI001"
 *         cargaHoraria:
 *           type: integer
 *           description: Carga horária
 *           example: 60
 *         cursoId:
 *           type: integer
 *           description: ID do curso
 *           example: 1
 *       required:
 *         - nome
 *         - cargaHoraria
 *         - cursoId
 */

/**
 * @swagger
 * /api/disciplinas:
 *   get:
 *     tags: [Disciplinas]
 *     summary: Lista todas as disciplinas
 *     description: Retorna lista de disciplinas cadastradas no sistema
 *     responses:
 *       200:
 *         description: Lista de disciplinas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Found 12 records"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Disciplina'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Disciplinas]
 *     summary: Cria nova disciplina
 *     description: Cadastra nova disciplina no sistema (requer permissão ADMIN ou SECRETARIA)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDisciplina'
 *     responses:
 *       201:
 *         description: Disciplina criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Resource created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Disciplina'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Permissão insuficiente (requer ADMIN ou SECRETARIA)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 */

const router = Router();

const PeriodoParamSchema = z.object({
  periodoId: z.coerce.number().int().positive(),
});

const DisciplinaPeriodoParamsSchema = PeriodoParamSchema.extend({
  disciplinaId: z.coerce.number().int().positive(),
});

// Create Enhanced CRUD factory for disciplinas with joins
const disciplinasCrud = new EnhancedCrudFactory({
  table: disciplinas,
  joinTables: [
    {
      table: cursos,
      on: eq(disciplinas.cursoId, cursos.id),
    },
  ],
  searchFields: ['nome', 'codigo'], // Search by discipline name or code
  orderBy: [{ field: 'nome', direction: 'asc' }],
});

const findDisciplinaById = async (id: number) => {
  const rows = await db
    .select({
      id: disciplinas.id,
      cursoId: disciplinas.cursoId,
    })
    .from(disciplinas)
    .where(eq(disciplinas.id, id))
    .limit(1);

  if (rows.length === 0) {
    throw createError('Disciplina informada não existe', 404);
  }

  return rows[0];
};

const findPeriodoById = async (id: number) => {
  const rows = await db
    .select({
      id: periodos.id,
      cursoId: curriculos.cursoId,
      curriculoId: periodos.curriculoId,
      numero: periodos.numero,
    })
    .from(periodos)
    .leftJoin(curriculos, eq(curriculos.id, periodos.curriculoId))
    .where(eq(periodos.id, id))
    .limit(1);

  if (rows.length === 0) {
    throw createError('Período informado não existe', 404);
  }

  return rows[0];
};

const ensureDisciplinaPeriodoSameCurso = async (disciplinaId: number, periodoId: number) => {
  const disciplina = await findDisciplinaById(disciplinaId);
  const periodo = await findPeriodoById(periodoId);

  if (disciplina.cursoId !== periodo.cursoId) {
    throw createError('Disciplina e período pertencem a cursos diferentes', 400);
  }

  return { disciplina, periodo };
};

const attachDisciplinaToPeriodo = asyncHandler(async (req: Request, res: Response) => {
  const { periodoId } = PeriodoParamSchema.parse(req.params);
  const payload = CreateDisciplinaPeriodoSchema.parse({ ...req.body, periodoId });

  await ensureDisciplinaPeriodoSameCurso(payload.disciplinaId, periodoId);

  try {
    const [created] = await db
      .insert(disciplinasPeriodos)
      .values({
        disciplinaId: payload.disciplinaId,
        periodoId,
        ordem: payload.ordem,
        obrigatoria: payload.obrigatoria ?? true,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Disciplina vinculada ao período com sucesso',
      data: created,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      throw createError('Disciplina já está vinculada a este período', 409);
    }
    throw error;
  }
});

const updateDisciplinaPeriodo = asyncHandler(async (req: Request, res: Response) => {
  const { periodoId, disciplinaId } = DisciplinaPeriodoParamsSchema.parse(req.params);
  const payload = UpdateDisciplinaPeriodoSchema.parse(req.body);

  await ensureDisciplinaPeriodoSameCurso(Number(disciplinaId), Number(periodoId));

  const existing = await db
    .select({ id: disciplinasPeriodos.id })
    .from(disciplinasPeriodos)
    .where(
      and(
        eq(disciplinasPeriodos.disciplinaId, Number(disciplinaId)),
        eq(disciplinasPeriodos.periodoId, Number(periodoId))
      ),
    )
    .limit(1);

  if (existing.length === 0) {
    throw createError('Vínculo disciplina/período não encontrado', 404);
  }

  const [updated] = await db
    .update(disciplinasPeriodos)
    .set(payload)
    .where(
      and(
        eq(disciplinasPeriodos.disciplinaId, Number(disciplinaId)),
        eq(disciplinasPeriodos.periodoId, Number(periodoId))
      ),
    )
    .returning();

  res.json({
    success: true,
    message: 'Vínculo atualizado com sucesso',
    data: updated,
  });
});

const detachDisciplinaFromPeriodo = asyncHandler(async (req: Request, res: Response) => {
  const { periodoId, disciplinaId } = DisciplinaPeriodoParamsSchema.parse(req.params);

  await ensureDisciplinaPeriodoSameCurso(Number(disciplinaId), Number(periodoId));

  const deleted = await db
    .delete(disciplinasPeriodos)
    .where(
      and(
        eq(disciplinasPeriodos.disciplinaId, Number(disciplinaId)),
        eq(disciplinasPeriodos.periodoId, Number(periodoId))
      ),
    )
    .returning();

  if (deleted.length === 0) {
    throw createError('Vínculo disciplina/período não encontrado', 404);
  }

  res.json({
    success: true,
    message: 'Disciplina desvinculada do período com sucesso',
    data: deleted[0],
  });
});

const createDisciplinaHandler = asyncHandler(async (req: Request, res: Response) => {
  const payload = CreateDisciplinaSchema.parse(req.body);

  const [disciplina] = await db.insert(disciplinas).values(payload).returning();

  res.status(201).json({
    success: true,
    message: 'Disciplina criada com sucesso',
    data: disciplina,
  });
});

const updateDisciplinaHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const payload = UpdateDisciplinaSchema.parse(req.body);

  const existing = await db.select().from(disciplinas).where(eq(disciplinas.id, id)).limit(1);
  if (existing.length === 0) {
    throw createError('Disciplina not found', 404);
  }

  const dataToUpdate = Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(dataToUpdate).length === 0) {
    throw createError('No valid fields to update', 400);
  }

  const [updated] = await db
    .update(disciplinas)
    .set(dataToUpdate)
    .where(eq(disciplinas.id, id))
    .returning();

  res.json({
    success: true,
    message: 'Disciplina atualizada com sucesso',
    data: updated,
  });
});

// Custom method to get disciplina with complete information
const getDisciplinaComplete = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const disciplina = await db
    .select({
      id: disciplinas.id,
      cursoId: disciplinas.cursoId,
      codigo: disciplinas.codigo,
      nome: disciplinas.nome,
      creditos: disciplinas.creditos,
      cargaHoraria: disciplinas.cargaHoraria,
      ementa: disciplinas.ementa,
      bibliografia: disciplinas.bibliografia,
      objetivos: disciplinas.objetivos,
      conteudoProgramatico: disciplinas.conteudoProgramatico,
      instrumentosEAvaliacao: disciplinas.instrumentosEAvaliacao,
      ativo: disciplinas.ativo,
      curso: {
        id: cursos.id,
        nome: cursos.nome,
        grau: cursos.grau,
      },
    })
    .from(disciplinas)
    .leftJoin(cursos, eq(disciplinas.cursoId, cursos.id))
    .where(eq(disciplinas.id, id))
    .limit(1);

  if (disciplina.length === 0) {
    throw createError('Disciplina not found', 404);
  }

  const periodosVinculados = await db
    .select({
      disciplinaId: disciplinasPeriodos.disciplinaId,
      periodoId: disciplinasPeriodos.periodoId,
      ordem: disciplinasPeriodos.ordem,
      obrigatoria: disciplinasPeriodos.obrigatoria,
      periodo: {
        id: periodos.id,
        numero: periodos.numero,
        nome: periodos.nome,
        curriculoId: periodos.curriculoId,
        turnoId: curriculos.turnoId,
      },
    })
    .from(disciplinasPeriodos)
    .innerJoin(periodos, eq(disciplinasPeriodos.periodoId, periodos.id))
    .innerJoin(curriculos, eq(curriculos.id, periodos.curriculoId))
    .where(eq(disciplinasPeriodos.disciplinaId, id))
    .orderBy(asc(periodos.numero));

  res.json({
    success: true,
    data: {
      ...disciplina[0],
      periodos: periodosVinculados,
    },
  });
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /disciplinas - List all disciplinas with curso information
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      cursoId,
      periodoId,
      curriculoId,
      page = '1',
      limit = '20',
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];

    if (cursoId) {
      conditions.push(eq(disciplinas.cursoId, Number(cursoId)));
    }

    if (search && typeof search === 'string' && search.trim().length) {
      const term = `%${search.trim()}%`;
      conditions.push(or(like(disciplinas.nome, term), like(disciplinas.codigo, term)));
    }

    if (periodoId) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM disciplinas_periodos dp WHERE dp.disciplina_id = ${disciplinas.id} AND dp.periodo_id = ${Number(
          periodoId,
        )})`,
      );
    }

    if (curriculoId) {
      conditions.push(
        sql`EXISTS (
          SELECT 1
          FROM disciplinas_periodos dp
          INNER JOIN periodos p ON p.id = dp.periodo_id
          WHERE dp.disciplina_id = ${disciplinas.id}
            AND p.curriculo_id = ${Number(curriculoId)}
        )`,
      );
    }

    let query = db
      .select({
        id: disciplinas.id,
        cursoId: disciplinas.cursoId,
        codigo: disciplinas.codigo,
        nome: disciplinas.nome,
        creditos: disciplinas.creditos,
        cargaHoraria: disciplinas.cargaHoraria,
        ementa: disciplinas.ementa,
        bibliografia: disciplinas.bibliografia,
        objetivos: disciplinas.objetivos,
        conteudoProgramatico: disciplinas.conteudoProgramatico,
        instrumentosEAvaliacao: disciplinas.instrumentosEAvaliacao,
        ativo: disciplinas.ativo,
        curso: {
          id: cursos.id,
          nome: cursos.nome,
          grau: cursos.grau,
        },
      })
      .from(disciplinas)
      .leftJoin(cursos, eq(disciplinas.cursoId, cursos.id));

    const sortableColumns: Record<string, any> = {
      id: disciplinas.id,
      nome: disciplinas.nome,
      codigo: disciplinas.codigo,
      creditos: disciplinas.creditos,
      cargaHoraria: disciplinas.cargaHoraria,
      cursoId: disciplinas.cursoId,
    };
    const orderColumn = typeof sortBy === 'string' && sortableColumns[sortBy] ? sortableColumns[sortBy] : disciplinas.nome;
    const orderExpr = sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);
    
    const finalQuery = conditions.length === 1
      ? query.where(conditions[0]).orderBy(orderExpr).limit(limitNum).offset(offset)
      : conditions.length > 1
      ? query.where(and(...conditions)).orderBy(orderExpr).limit(limitNum).offset(offset)
      : query.orderBy(orderExpr).limit(limitNum).offset(offset);

    const rows = await finalQuery;
    const disciplinaIds = rows.map((row) => row.id);

    const periodosMap = new Map<number, any[]>();
    if (disciplinaIds.length > 0) {
      const vinculos = await db
        .select({
          disciplinaId: disciplinasPeriodos.disciplinaId,
          periodoId: disciplinasPeriodos.periodoId,
          ordem: disciplinasPeriodos.ordem,
          obrigatoria: disciplinasPeriodos.obrigatoria,
          periodo: {
            id: periodos.id,
            numero: periodos.numero,
                nome: periodos.nome,
                curriculoId: periodos.curriculoId,
                turnoId: curriculos.turnoId,
          },
        })
        .from(disciplinasPeriodos)
        .innerJoin(periodos, eq(disciplinasPeriodos.periodoId, periodos.id))
        .innerJoin(curriculos, eq(curriculos.id, periodos.curriculoId))
        .where(inArray(disciplinasPeriodos.disciplinaId, disciplinaIds))
        .orderBy(disciplinasPeriodos.disciplinaId, asc(periodos.numero));

      for (const vinculo of vinculos) {
        const list = periodosMap.get(vinculo.disciplinaId) ?? [];
        list.push({
          periodoId: vinculo.periodoId,
          ordem: vinculo.ordem ?? undefined,
          obrigatoria: vinculo.obrigatoria,
          periodo: vinculo.periodo,
        });
        periodosMap.set(vinculo.disciplinaId, list);
      }
    }

    const countQuery = conditions.length === 1
      ? db.select({ value: sql<number>`count(*)` }).from(disciplinas).where(conditions[0])
      : conditions.length > 1
      ? db.select({ value: sql<number>`count(*)` }).from(disciplinas).where(and(...conditions))
      : db.select({ value: sql<number>`count(*)` }).from(disciplinas);

    const countResult = await countQuery;
    const total = countResult[0]?.value ?? 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    const data = rows.map((row) => ({
      ...row,
      periodos: periodosMap.get(row.id) ?? [],
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
      message: `Found ${data.length} records`,
    });
  }),
);

// GET /disciplinas/:id - Get disciplina by ID with complete information
router.get('/:id', validateParams(IdParamSchema), getDisciplinaComplete);

// POST /disciplinas - Create new disciplina (requires ADMIN or SECRETARIA)
router.post('/', requireSecretaria, validateBody(CreateDisciplinaSchema), createDisciplinaHandler);

// PATCH /disciplinas/:id - Update disciplina (requires ADMIN or SECRETARIA)
router.patch(
  '/:id',
  validateParams(IdParamSchema),
  requireSecretaria,
  validateBody(UpdateDisciplinaSchema),
  updateDisciplinaHandler
);

// DELETE /disciplinas/:id - Delete disciplina (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, disciplinasCrud.delete);

// POST /periodos/:periodoId/disciplinas - vincula disciplina a um período
router.post(
  '/periodos/:periodoId/disciplinas',
  validateParams(PeriodoParamSchema),
  requireSecretaria,
  validateBody(CreateDisciplinaPeriodoSchema.omit({ periodoId: true })),
  attachDisciplinaToPeriodo,
);

// PATCH /periodos/:periodoId/disciplinas/:disciplinaId - atualiza vínculo
router.patch(
  '/periodos/:periodoId/disciplinas/:disciplinaId',
  validateParams(DisciplinaPeriodoParamsSchema),
  requireSecretaria,
  validateBody(UpdateDisciplinaPeriodoSchema),
  updateDisciplinaPeriodo,
);

// DELETE /periodos/:periodoId/disciplinas/:disciplinaId - remove vínculo
router.delete(
  '/periodos/:periodoId/disciplinas/:disciplinaId',
  validateParams(DisciplinaPeriodoParamsSchema),
  requireSecretaria,
  detachDisciplinaFromPeriodo,
);

export default router; 