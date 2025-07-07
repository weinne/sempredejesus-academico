import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { cursos } from '../db/schema';
import { CreateCursoSchema, UpdateCursoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     Curso:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do curso
 *         nome:
 *           type: string
 *           description: Nome do curso
 *           example: "Teologia"
 *         descricao:
 *           type: string
 *           description: Descrição do curso
 *           example: "Curso de Teologia Fundamental"
 *         grau:
 *           type: string
 *           description: Grau acadêmico
 *           enum: ["BACHARELADO", "LICENCIATURA", "ESPECIALIZACAO", "MESTRADO", "DOUTORADO"]
 *           example: "BACHARELADO"
 *         cargaHoraria:
 *           type: integer
 *           description: Carga horária total do curso
 *           example: 3200
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateCurso:
 *       type: object
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome do curso
 *           example: "Teologia"
 *         descricao:
 *           type: string
 *           description: Descrição do curso
 *           example: "Curso de Teologia Fundamental"
 *         grau:
 *           type: string
 *           description: Grau acadêmico
 *           enum: ["BACHARELADO", "LICENCIATURA", "ESPECIALIZACAO", "MESTRADO", "DOUTORADO"]
 *           example: "BACHARELADO"
 *         cargaHoraria:
 *           type: integer
 *           description: Carga horária total
 *           example: 3200
 *       required:
 *         - nome
 *         - grau
 */

/**
 * @swagger
 * /api/cursos:
 *   get:
 *     tags: [Cursos]
 *     summary: Lista todos os cursos
 *     description: Retorna lista de cursos disponíveis no sistema
 *     responses:
 *       200:
 *         description: Lista de cursos retornada com sucesso
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
 *                   example: "Found 3 records"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Curso'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Cursos]
 *     summary: Cria novo curso
 *     description: Cadastra novo curso no sistema (requer permissão ADMIN ou SECRETARIA)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCurso'
 *     responses:
 *       201:
 *         description: Curso criado com sucesso
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
 *                   $ref: '#/components/schemas/Curso'
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

// Create CRUD factory for cursos (simplified)
const cursosCrud = new SimpleCrudFactory({
  table: cursos,
  createSchema: CreateCursoSchema,
  updateSchema: UpdateCursoSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /cursos - List all cursos (any authenticated user can view)
router.get('/', cursosCrud.getAll);

// GET /cursos/:id - Get curso by ID (any authenticated user can view)
router.get('/:id', validateParams(IdParamSchema), cursosCrud.getById);

// POST /cursos - Create new curso (requires ADMIN or SECRETARIA)
router.post('/', requireSecretaria, cursosCrud.create);

// PATCH /cursos/:id - Update curso (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, cursosCrud.update);

// DELETE /cursos/:id - Delete curso (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, cursosCrud.delete);

export default router; 