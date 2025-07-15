import { Router } from 'express';
import { EnhancedCrudFactory } from '../core/crud.factory.enhanced';
import { professores, pessoas, users } from '../db/schema';
import { CreateProfessorSchema, UpdateProfessorSchema, CreateProfessorWithUserSchema, StringIdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireProfessor } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import bcrypt from 'bcrypt';

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

// Create Enhanced CRUD factory for professores with joins
const professoresCrud = new EnhancedCrudFactory({
  table: professores,
  createSchema: CreateProfessorSchema,
  updateSchema: UpdateProfessorSchema,
  joinTables: [
    {
      table: pessoas,
      on: eq(professores.pessoaId, pessoas.id),
    }
  ],
  searchFields: ['nomeCompleto'], // Search by pessoa name
  orderBy: [{ field: 'matricula', direction: 'asc' }],
});

// Custom method to create professor with automatic user creation
const createProfessorWithUser = asyncHandler(async (req, res) => {
  const validatedData = CreateProfessorWithUserSchema.parse(req.body);
  const { createUser, username, password, ...professorData } = validatedData;

  // Start transaction
  const result = await db.transaction(async (tx) => {
    // Create professor
    const [novoProfessor] = await tx
      .insert(professores)
      .values(professorData)
      .returning();

    // Create user if requested
    let novoUser = null;
    if (createUser && username && password) {
      const passwordHash = await bcrypt.hash(password, 12);
      
      [novoUser] = await tx
        .insert(users)
        .values({
          pessoaId: professorData.pessoaId,
          username,
          passwordHash,
          role: 'PROFESSOR',
          isActive: 'S',
        })
        .returning();
    }

    return { professor: novoProfessor, user: novoUser };
  });

  res.status(201).json({
    success: true,
    message: 'Professor criado com sucesso',
    data: {
      professor: result.professor,
      user: result.user ? { id: result.user.id, username: result.user.username } : null,
    },
  });
});

// Custom method to get professor with complete information  
const getProfessorComplete = asyncHandler(async (req, res) => {
  const matricula = req.params.id;

  const result = await db
    .select({
      // Professor fields
      matricula: professores.matricula,
      pessoaId: professores.pessoaId,
      dataInicio: professores.dataInicio,
      formacaoAcad: professores.formacaoAcad,
      situacao: professores.situacao,
      // Pessoa fields
      pessoa: {
        id: pessoas.id,
        nomeCompleto: pessoas.nomeCompleto,
        sexo: pessoas.sexo,
        email: pessoas.email,
        cpf: pessoas.cpf,
        dataNasc: pessoas.dataNasc,
        telefone: pessoas.telefone,
        endereco: pessoas.endereco,
      }
    })
    .from(professores)
    .leftJoin(pessoas, eq(professores.pessoaId, pessoas.id))
    .where(eq(professores.matricula, matricula))
    .limit(1);

  if (result.length === 0) {
    throw createError('Professor not found', 404);
  }

  res.json({
    success: true,
    data: result[0],
  });
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /professores - List all professores with pessoa information
router.get('/', professoresCrud.getAll);

// GET /professores/:id - Get professor by matricula with complete information
router.get('/:id', validateParams(StringIdParamSchema), getProfessorComplete);

// POST /professores - Create new professor with optional user creation
router.post('/', requireSecretaria, createProfessorWithUser);

// PATCH /professores/:id - Update professor (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(StringIdParamSchema), requireSecretaria, professoresCrud.update);

// DELETE /professores/:id - Delete professor (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(StringIdParamSchema), requireSecretaria, professoresCrud.delete);

export default router; 