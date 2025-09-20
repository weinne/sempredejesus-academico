import { Router, Request, Response } from 'express';
import { EnhancedCrudFactory } from '../core/crud.factory.enhanced';
import { disciplinas, cursos, periodos } from '../db/schema';
import { CreateDisciplinaSchema, UpdateDisciplinaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';

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

// Create Enhanced CRUD factory for disciplinas with joins
const disciplinasCrud = new EnhancedCrudFactory({
  table: disciplinas,
  joinTables: [
    {
      table: cursos,
      on: eq(disciplinas.cursoId, cursos.id),
    },
    {
      table: periodos,
      on: eq(disciplinas.periodoId, periodos.id),
    },
  ],
  searchFields: ['nome', 'codigo'], // Search by discipline name or code
  orderBy: [{ field: 'nome', direction: 'asc' }],
});

const assertPeriodoBelongsToCurso = async (cursoId: number, periodoId: number) => {
  const periodo = await db.select().from(periodos).where(eq(periodos.id, periodoId)).limit(1);
  if (periodo.length === 0) {
    throw createError('Período informado não existe', 404);
  }

  if (periodo[0].cursoId !== cursoId) {
    throw createError('O período selecionado não pertence ao curso informado', 400);
  }
};

const createDisciplinaHandler = asyncHandler(async (req: Request, res: Response) => {
  const payload = CreateDisciplinaSchema.parse(req.body);

  await assertPeriodoBelongsToCurso(payload.cursoId, payload.periodoId);

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

  const cursoId = (dataToUpdate.cursoId as number | undefined) ?? existing[0].cursoId;
  const periodoId = (dataToUpdate.periodoId as number | undefined) ?? existing[0].periodoId;

  await assertPeriodoBelongsToCurso(cursoId, periodoId);

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
  const id = parseInt(req.params.id);

  const result = await db
    .select({
      id: disciplinas.id,
      cursoId: disciplinas.cursoId,
      periodoId: disciplinas.periodoId,
      codigo: disciplinas.codigo,
      nome: disciplinas.nome,
      creditos: disciplinas.creditos,
      cargaHoraria: disciplinas.cargaHoraria,
      ementa: disciplinas.ementa,
      bibliografia: disciplinas.bibliografia,
      ativo: disciplinas.ativo,
      curso: {
        id: cursos.id,
        nome: cursos.nome,
        grau: cursos.grau,
      },
      periodo: {
        id: periodos.id,
        numero: periodos.numero,
        nome: periodos.nome,
      },
    })
    .from(disciplinas)
    .leftJoin(cursos, eq(disciplinas.cursoId, cursos.id))
    .leftJoin(periodos, eq(disciplinas.periodoId, periodos.id))
    .where(eq(disciplinas.id, id))
    .limit(1);

  if (result.length === 0) {
    throw createError('Disciplina not found', 404);
  }

  res.json({
    success: true,
    data: result[0],
  });
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /disciplinas - List all disciplinas with curso information
router.get('/', disciplinasCrud.getAll);

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

export default router; 