import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { pessoas } from '../db/schema';
import { CreatePessoaSchema, UpdatePessoaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

/**
 * @swagger
 * /api/pessoas:
 *   get:
 *     tags: [Pessoas]
 *     summary: Lista todas as pessoas
 *     description: Retorna lista paginada de pessoas cadastradas no sistema
 *     responses:
 *       200:
 *         description: Lista de pessoas retornada com sucesso
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
 *                   example: "Found 10 records"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pessoa'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Pessoas]
 *     summary: Cria nova pessoa
 *     description: Cadastra nova pessoa no sistema (requer permissão ADMIN ou SECRETARIA)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePessoa'
 *     responses:
 *       201:
 *         description: Pessoa criada com sucesso
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
 *                   $ref: '#/components/schemas/Pessoa'
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
 *         description: Permissão insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/pessoas/{id}:
 *   get:
 *     tags: [Pessoas]
 *     summary: Busca pessoa por ID
 *     description: Retorna dados de uma pessoa específica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     responses:
 *       200:
 *         description: Pessoa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pessoa'
 *       404:
 *         description: Pessoa não encontrada
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
 *     tags: [Pessoas]
 *     summary: Atualiza pessoa
 *     description: Atualiza dados de pessoa existente (requer permissão ADMIN ou SECRETARIA)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCompleto:
 *                 type: string
 *                 example: "João Silva Santos"
 *               email:
 *                 type: string
 *                 example: "joao.novo@example.com"
 *               telefone:
 *                 type: string
 *                 example: "(11) 88888-8888"
 *     responses:
 *       200:
 *         description: Pessoa atualizada com sucesso
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
 *                   $ref: '#/components/schemas/Pessoa'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Pessoa não encontrada
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
 *         description: Permissão insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     tags: [Pessoas]
 *     summary: Remove pessoa
 *     description: Remove pessoa do sistema (requer permissão ADMIN ou SECRETARIA)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *     responses:
 *       200:
 *         description: Pessoa removida com sucesso
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
 *                   $ref: '#/components/schemas/Pessoa'
 *       404:
 *         description: Pessoa não encontrada
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
 *         description: Permissão insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 */

const router = Router();

// Create CRUD factory for pessoas (simplified version)
const pessoasCrud = new SimpleCrudFactory({
  table: pessoas,
  createSchema: CreatePessoaSchema,
  updateSchema: UpdatePessoaSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /pessoas - List all pessoas (any authenticated user can view)
router.get('/', pessoasCrud.getAll);

// GET /pessoas/:id - Get pessoa by ID (any authenticated user can view)
router.get('/:id', validateParams(IdParamSchema), pessoasCrud.getById);

// POST /pessoas - Create new pessoa (requires ADMIN or SECRETARIA)
router.post('/', requireSecretaria, pessoasCrud.create);

// PATCH /pessoas/:id - Update pessoa (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, pessoasCrud.update);

// DELETE /pessoas/:id - Delete pessoa (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, pessoasCrud.delete);

export default router; 