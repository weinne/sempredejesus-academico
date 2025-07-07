import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { turmas } from '../db/schema';
import { CreateTurmaSchema, UpdateTurmaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireProfessor } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     Turma:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da turma
 *         codigo:
 *           type: string
 *           description: Código da turma
 *           example: "TSI001-2024.1"
 *         disciplinaId:
 *           type: integer
 *           description: ID da disciplina
 *           example: 1
 *         professorId:
 *           type: string
 *           description: Matrícula do professor responsável
 *           example: "PROF001"
 *         semestre:
 *           type: string
 *           description: Semestre letivo
 *           example: "2024.1"
 *         vagas:
 *           type: integer
 *           description: Número de vagas disponíveis
 *           example: 30
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateTurma:
 *       type: object
 *       properties:
 *         codigo:
 *           type: string
 *           description: Código único da turma
 *           example: "TSI001-2024.1"
 *         disciplinaId:
 *           type: integer
 *           description: ID da disciplina
 *           example: 1
 *         professorId:
 *           type: string
 *           description: Matrícula do professor
 *           example: "PROF001"
 *         semestre:
 *           type: string
 *           description: Semestre letivo
 *           example: "2024.1"
 *         vagas:
 *           type: integer
 *           description: Número de vagas
 *           example: 30
 *       required:
 *         - codigo
 *         - disciplinaId
 *         - professorId
 *         - semestre
 */

/**
 * @swagger
 * /api/turmas:
 *   get:
 *     tags: [Turmas]
 *     summary: Lista todas as turmas
 *     description: Retorna lista de turmas cadastradas no sistema
 *     responses:
 *       200:
 *         description: Lista de turmas retornada com sucesso
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
 *                   example: "Found 8 records"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Turma'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Turmas]
 *     summary: Cria nova turma
 *     description: Cadastra nova turma no sistema (requer permissão ADMIN, SECRETARIA ou PROFESSOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTurma'
 *     responses:
 *       201:
 *         description: Turma criada com sucesso
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
 *                   $ref: '#/components/schemas/Turma'
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
 *         description: Permissão insuficiente (requer ADMIN, SECRETARIA ou PROFESSOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 */

const router = Router();

// Create CRUD factory for turmas (simplified)
const turmasCrud = new SimpleCrudFactory({
  table: turmas,
  createSchema: CreateTurmaSchema,
  updateSchema: UpdateTurmaSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /turmas - List all turmas (any authenticated user can view)
router.get('/', turmasCrud.getAll);

// GET /turmas/:id - Get turma by ID (any authenticated user can view)
router.get('/:id', validateParams(IdParamSchema), turmasCrud.getById);

// POST /turmas - Create new turma (requires ADMIN, SECRETARIA or PROFESSOR)
router.post('/', requireProfessor, turmasCrud.create);

// PATCH /turmas/:id - Update turma (requires ADMIN, SECRETARIA or PROFESSOR)
router.patch('/:id', validateParams(IdParamSchema), requireProfessor, turmasCrud.update);

// DELETE /turmas/:id - Delete turma (requires ADMIN, SECRETARIA or PROFESSOR)
router.delete('/:id', validateParams(IdParamSchema), requireProfessor, turmasCrud.delete);

export default router; 