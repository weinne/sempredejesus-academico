import { Router } from 'express';
import { EnhancedCrudFactory } from '../core/crud.factory.enhanced';
import { disciplinas, cursos } from '../db/schema';
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
  createSchema: CreateDisciplinaSchema,
  updateSchema: UpdateDisciplinaSchema,
  joinTables: [
    {
      table: cursos,
      on: eq(disciplinas.cursoId, cursos.id),
    }
  ],
  searchFields: ['nome', 'codigo'], // Search by discipline name or code
  orderBy: [{ field: 'nome', direction: 'asc' }],
});

// Custom method to get disciplina with complete information  
const getDisciplinaComplete = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const result = await db
    .select({
      // Disciplina fields
      id: disciplinas.id,
      cursoId: disciplinas.cursoId,
      codigo: disciplinas.codigo,
      nome: disciplinas.nome,
      creditos: disciplinas.creditos,
      cargaHoraria: disciplinas.cargaHoraria,
      ementa: disciplinas.ementa,
      bibliografia: disciplinas.bibliografia,
      ativo: disciplinas.ativo,
      // Curso fields
      curso: {
        id: cursos.id,
        nome: cursos.nome,
        grau: cursos.grau,
      }
    })
    .from(disciplinas)
    .leftJoin(cursos, eq(disciplinas.cursoId, cursos.id))
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
router.post('/', requireSecretaria, validateBody(CreateDisciplinaSchema), disciplinasCrud.create);

// PATCH /disciplinas/:id - Update disciplina (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, validateBody(UpdateDisciplinaSchema), disciplinasCrud.update);

// DELETE /disciplinas/:id - Delete disciplina (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, disciplinasCrud.delete);

export default router; 