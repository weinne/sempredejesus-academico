import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { professores } from '../db/schema';
import { CreateProfessorSchema, UpdateProfessorSchema, StringIdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireProfessor } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     Professor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do professor
 *         pessoaId:
 *           type: integer
 *           description: ID da pessoa vinculada
 *         matricula:
 *           type: string
 *           description: Matrícula do professor
 *           example: "PROF001"
 *         situacao:
 *           type: string
 *           description: Situação do professor
 *           enum: ["ATIVO", "INATIVO", "AFASTADO"]
 *           example: "ATIVO"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateProfessor:
 *       type: object
 *       properties:
 *         pessoaId:
 *           type: integer
 *           description: ID da pessoa a vincular como professor
 *           example: 1
 *         matricula:
 *           type: string
 *           description: Matrícula do professor
 *           example: "PROF001"
 *         situacao:
 *           type: string
 *           description: Situação inicial do professor
 *           enum: ["ATIVO", "INATIVO", "AFASTADO"]
 *           example: "ATIVO"
 *       required:
 *         - pessoaId
 *         - matricula
 *         - situacao
 */

/**
 * @swagger
 * /api/professores:
 *   get:
 *     tags: [Professores]
 *     summary: Lista todos os professores
 *     description: Retorna lista de professores cadastrados no sistema
 *     responses:
 *       200:
 *         description: Lista de professores retornada com sucesso
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
 *                   example: "Found 5 records"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Professor'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Professores]
 *     summary: Cadastra novo professor
 *     description: Cria novo professor no sistema (requer permissão ADMIN ou SECRETARIA)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProfessor'
 *     responses:
 *       201:
 *         description: Professor criado com sucesso
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
 *                   $ref: '#/components/schemas/Professor'
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

/**
 * @swagger
 * /api/professores/{id}:
 *   get:
 *     tags: [Professores]
 *     summary: Busca professor por matrícula
 *     description: Retorna dados de um professor específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Matrícula do professor
 *         example: "PROF001"
 *     responses:
 *       200:
 *         description: Professor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Professor'
 *       404:
 *         description: Professor não encontrado
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
 *     security:
 *       - bearerAuth: []
 *   patch:
 *     tags: [Professores]
 *     summary: Atualiza professor
 *     description: Atualiza dados de professor existente (requer permissão ADMIN ou SECRETARIA)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Matrícula do professor
 *         example: "PROF001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               situacao:
 *                 type: string
 *                 enum: ["ATIVO", "INATIVO", "AFASTADO"]
 *                 example: "AFASTADO"
 *     responses:
 *       200:
 *         description: Professor atualizado com sucesso
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
 *                   example: "Resource updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Professor'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Professor não encontrado
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
 *   delete:
 *     tags: [Professores]
 *     summary: Remove professor
 *     description: Remove professor do sistema (requer permissão ADMIN ou SECRETARIA)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Matrícula do professor
 *         example: "PROF001"
 *     responses:
 *       200:
 *         description: Professor removido com sucesso
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
 *                   example: "Resource deleted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Professor'
 *       404:
 *         description: Professor não encontrado
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

// Create CRUD factory for professores (simplified)
const professoresCrud = new SimpleCrudFactory({
  table: professores,
  createSchema: CreateProfessorSchema,
  updateSchema: UpdateProfessorSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /professores - List all professores (any authenticated user can view)
router.get('/', professoresCrud.getAll);

// GET /professores/:id - Get professor by matricula (any authenticated user can view)
router.get('/:id', validateParams(StringIdParamSchema), professoresCrud.getById);

// POST /professores - Create new professor (requires ADMIN or SECRETARIA)
router.post('/', requireSecretaria, professoresCrud.create);

// PATCH /professores/:id - Update professor (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(StringIdParamSchema), requireSecretaria, professoresCrud.update);

// DELETE /professores/:id - Delete professor (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(StringIdParamSchema), requireSecretaria, professoresCrud.delete);

export default router; 