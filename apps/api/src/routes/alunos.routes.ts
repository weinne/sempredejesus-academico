import { Router } from 'express';
import { EnhancedCrudFactory } from '../core/crud.factory.enhanced';
import { alunos, pessoas, cursos, users } from '../db/schema';
import { CreateAlunoSchema, UpdateAlunoSchema, CreateAlunoWithUserSchema, StringIdParamSchema, CreateUserSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import bcrypt from 'bcrypt';

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

// Create Enhanced CRUD factory for alunos with joins
const alunosCrud = new EnhancedCrudFactory({
  table: alunos,
  createSchema: CreateAlunoSchema,
  updateSchema: UpdateAlunoSchema,
  joinTables: [
    {
      table: pessoas,
      on: eq(alunos.pessoaId, pessoas.id),
    },
    {
      table: cursos,
      on: eq(alunos.cursoId, cursos.id),
    }
  ],
  searchFields: ['nomeCompleto'], // Search by pessoa name
  orderBy: [{ field: 'ra', direction: 'asc' }],
});

// Custom method to create aluno with automatic user creation
const createAlunoWithUser = asyncHandler(async (req, res) => {
  const validatedData = CreateAlunoWithUserSchema.parse(req.body);
  const { createUser, username, password, ...alunoData } = validatedData;

  // Start transaction
  const result = await db.transaction(async (tx) => {
    // Create aluno
    const [novoAluno] = await tx
      .insert(alunos)
      .values(alunoData)
      .returning();

    // Create user if requested
    let novoUser = null;
    if (createUser && username && password) {
      const passwordHash = await bcrypt.hash(password, 12);
      
      [novoUser] = await tx
        .insert(users)
        .values({
          pessoaId: alunoData.pessoaId,
          username,
          passwordHash,
          role: 'ALUNO',
          isActive: 'S',
        })
        .returning();
    }

    return { aluno: novoAluno, user: novoUser };
  });

  res.status(201).json({
    success: true,
    message: 'Aluno criado com sucesso',
    data: {
      aluno: result.aluno,
      user: result.user ? { id: result.user.id, username: result.user.username } : null,
    },
  });
});

// Custom method to get aluno with complete information  
const getAlunoComplete = asyncHandler(async (req, res) => {
  const ra = req.params.id;

  const result = await db
    .select({
      // Aluno fields
      ra: alunos.ra,
      pessoaId: alunos.pessoaId,
      cursoId: alunos.cursoId,
      anoIngresso: alunos.anoIngresso,
      igreja: alunos.igreja,
      situacao: alunos.situacao,
      coeficienteAcad: alunos.coeficienteAcad,
      createdAt: alunos.createdAt,
      updatedAt: alunos.updatedAt,
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
      },
      // Curso fields
      curso: {
        id: cursos.id,
        nome: cursos.nome,
        grau: cursos.grau,
      }
    })
    .from(alunos)
    .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
    .leftJoin(cursos, eq(alunos.cursoId, cursos.id))
    .where(eq(alunos.ra, ra))
    .limit(1);

  if (result.length === 0) {
    throw createError('Aluno not found', 404);
  }

  res.json({
    success: true,
    data: result[0],
  });
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /alunos - List all alunos with pessoa and curso information
router.get('/', alunosCrud.getAll);

// GET /alunos/:id - Get aluno by RA with complete information
router.get('/:id', validateParams(StringIdParamSchema), getAlunoComplete);

// POST /alunos - Create new aluno with optional user creation
router.post('/', requireSecretaria, createAlunoWithUser);

// PATCH /alunos/:id - Update aluno (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(StringIdParamSchema), requireSecretaria, alunosCrud.update);

// DELETE /alunos/:id - Delete aluno (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(StringIdParamSchema), requireSecretaria, alunosCrud.delete);

export default router; 