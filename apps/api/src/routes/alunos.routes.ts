import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { alunos } from '../db/schema';
import { CreateAlunoSchema, UpdateAlunoSchema, StringIdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     Aluno:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do aluno
 *         pessoaId:
 *           type: integer
 *           description: ID da pessoa vinculada
 *         ra:
 *           type: string
 *           description: RA (Registro Acadêmico) do aluno
 *           example: "ALU2024001"
 *         situacao:
 *           type: string
 *           description: Situação acadêmica do aluno
 *           enum: ["ATIVO", "TRANCADO", "FORMADO", "DESISTENTE"]
 *           example: "ATIVO"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateAluno:
 *       type: object
 *       properties:
 *         pessoaId:
 *           type: integer
 *           description: ID da pessoa a vincular como aluno
 *           example: 1
 *         ra:
 *           type: string
 *           description: RA (Registro Acadêmico) único
 *           example: "ALU2024001"
 *         situacao:
 *           type: string
 *           description: Situação inicial do aluno
 *           enum: ["ATIVO", "TRANCADO", "FORMADO", "DESISTENTE"]
 *           example: "ATIVO"
 *       required:
 *         - pessoaId
 *         - ra
 *         - situacao
 */

/**
 * @swagger
 * /api/alunos:
 *   get:
 *     tags: [Alunos]
 *     summary: Lista todos os alunos
 *     description: Retorna lista de alunos cadastrados no sistema
 *     responses:
 *       200:
 *         description: Lista de alunos retornada com sucesso
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
 *                   example: "Found 15 records"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Aluno'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Alunos]
 *     summary: Cadastra novo aluno
 *     description: Cria novo aluno no sistema (requer permissão ADMIN ou SECRETARIA)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAluno'
 *     responses:
 *       201:
 *         description: Aluno criado com sucesso
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
 *                   $ref: '#/components/schemas/Aluno'
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

// Create CRUD factory for alunos (simplified)
const alunosCrud = new SimpleCrudFactory({
  table: alunos,
  createSchema: CreateAlunoSchema,
  updateSchema: UpdateAlunoSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /alunos - List all alunos (any authenticated user can view)
router.get('/', alunosCrud.getAll);

// GET /alunos/:id - Get aluno by RA (any authenticated user can view)
router.get('/:id', validateParams(StringIdParamSchema), alunosCrud.getById);

// POST /alunos - Create new aluno (requires ADMIN or SECRETARIA)
router.post('/', requireSecretaria, alunosCrud.create);

// PATCH /alunos/:id - Update aluno (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(StringIdParamSchema), requireSecretaria, alunosCrud.update);

// DELETE /alunos/:id - Delete aluno (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(StringIdParamSchema), requireSecretaria, alunosCrud.delete);

export default router; 