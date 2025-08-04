import { Router } from 'express';
import { EnhancedCrudFactory } from '../core/crud.factory.enhanced';
import { users, pessoas } from '../db/schema';
import { CreateUserSchema, UpdateUserSchema, ChangePasswordSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { eq } from 'drizzle-orm';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do usuário
 *         pessoaId:
 *           type: integer
 *           description: ID da pessoa vinculada
 *         username:
 *           type: string
 *           description: Nome de usuário único
 *           example: "joao.silva"
 *         role:
 *           type: string
 *           description: Papel do usuário no sistema
 *           enum: ["ADMIN", "SECRETARIA", "PROFESSOR", "ALUNO"]
 *           example: "ALUNO"
 *         isActive:
 *           type: string
 *           description: Status ativo do usuário
 *           enum: ["S", "N"]
 *           example: "S"
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Último login do usuário
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateUser:
 *       type: object
 *       properties:
 *         pessoaId:
 *           type: integer
 *           description: ID da pessoa a vincular como usuário
 *           example: 1
 *         username:
 *           type: string
 *           description: Nome de usuário único
 *           example: "joao.silva"
 *         password:
 *           type: string
 *           description: Senha do usuário
 *           example: "minhasenha123"
 *         role:
 *           type: string
 *           description: Papel inicial do usuário
 *           enum: ["ADMIN", "SECRETARIA", "PROFESSOR", "ALUNO"]
 *           example: "ALUNO"
 *         isActive:
 *           type: string
 *           description: "Status inicial (padrão: S)"
 *           enum: ["S", "N"]
 *           example: "S"
 *       required:
 *         - pessoaId
 *         - username
 *         - password
 *         - role
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Lista todos os usuários
 *     description: Retorna lista paginada de usuários cadastrados no sistema (apenas ADMIN)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Itens por página (máx 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome de usuário ou nome da pessoa
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: id
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente (requer ADMIN)
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Users]
 *     summary: Cria novo usuário
 *     description: Cadastra novo usuário no sistema (apenas ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
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
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente (requer ADMIN)
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Busca usuário por ID
 *     description: Retorna dados de um usuário específico (apenas ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente (requer ADMIN)
 *     security:
 *       - bearerAuth: []
 *   patch:
 *     tags: [Users]
 *     summary: Atualiza usuário
 *     description: Atualiza dados de usuário existente (apenas ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "joao.silva.novo"
 *               role:
 *                 type: string
 *                 enum: ["ADMIN", "SECRETARIA", "PROFESSOR", "ALUNO"]
 *                 example: "PROFESSOR"
 *               isActive:
 *                 type: string
 *                 enum: ["S", "N"]
 *                 example: "N"
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente (requer ADMIN)
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     tags: [Users]
 *     summary: Remove usuário
 *     description: Remove usuário do sistema (apenas ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário removido com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente (requer ADMIN)
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/users/{id}/change-password:
 *   patch:
 *     tags: [Users]
 *     summary: Altera senha do usuário
 *     description: Permite ao usuário alterar sua própria senha ou ao ADMIN alterar qualquer senha
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Senha atual (obrigatória para não-admin)
 *                 example: "senhaatual123"
 *               newPassword:
 *                 type: string
 *                 description: Nova senha
 *                 example: "novasenh123"
 *               confirmPassword:
 *                 type: string
 *                 description: Confirmação da nova senha
 *                 example: "novasenha123"
 *             required:
 *               - newPassword
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Dados inválidos ou senha atual incorreta
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Não autorizado
 *     security:
 *       - bearerAuth: []
 */

const router = Router();

// Create Enhanced CRUD factory for users with pessoa join
const usersCrud = new EnhancedCrudFactory({
  table: users,
  createSchema: CreateUserSchema,
  updateSchema: UpdateUserSchema,
  joinTables: [
    {
      table: pessoas,
      on: eq(users.pessoaId, pessoas.id),
    }
  ],
  searchFields: ['username'],
  orderBy: [{ field: 'id', direction: 'asc' }],
  passwordFields: ['password'],
});

// All routes require authentication
router.use(requireAuth);

// GET /users - List all users (ADMIN only)
router.get('/', requireAdmin, usersCrud.getAll);

// GET /users/:id - Get user by ID (ADMIN only)
router.get('/:id', requireAdmin, validateParams(IdParamSchema), usersCrud.getById);

// POST /users - Create new user (ADMIN only)
router.post('/', requireAdmin, validateBody(CreateUserSchema), usersCrud.create);

// PATCH /users/:id - Update user (ADMIN only)
router.patch('/:id', requireAdmin, validateParams(IdParamSchema), validateBody(UpdateUserSchema), usersCrud.update);

// DELETE /users/:id - Delete user (ADMIN only)
router.delete('/:id', requireAdmin, validateParams(IdParamSchema), usersCrud.delete);

// PATCH /users/:id/change-password - Change password (User can change own, ADMIN can change any)
router.patch('/:id/change-password', 
  validateParams(IdParamSchema), 
  validateBody(ChangePasswordSchema), 
  usersCrud.changePassword
);

export default router;