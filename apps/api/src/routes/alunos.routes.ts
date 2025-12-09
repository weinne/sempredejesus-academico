import { Router, Request, Response } from 'express';
import { EnhancedCrudFactory } from '../core/crud.factory.enhanced';
import { alunos, pessoas, cursos, users, periodos, userRoles, curriculos, turnos, coortes } from '../db/schema';
import { UpdateAlunoSchema, CreateAlunoWithUserSchema, StringIdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { eq, and, like, asc, desc, sql, or } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { assertPeriodoBelongsToCurso, createAlunoWithUserRecord, getAlunoCompleteByRa } from '../services/alunos.service';

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

// Create Enhanced CRUD factory for alunos with proper primaryKey and joins
const alunosCrud = new EnhancedCrudFactory({
  table: alunos,
  primaryKey: 'ra', // Chave primária correta para alunos
  joinTables: [
    {
      table: pessoas,
      on: eq(alunos.pessoaId, pessoas.id),
    },
    {
      table: cursos,
      on: eq(alunos.cursoId, cursos.id),
    },
    {
      table: periodos,
      on: eq(alunos.periodoId, periodos.id),
    },
  ],
  searchFields: ['ra'], // Busca por RA
  orderBy: [{ field: 'ra', direction: 'asc' }],
});

// Custom method to create aluno with automatic pessoa (inline) and user creation
const createAlunoWithUser = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = CreateAlunoWithUserSchema.parse(req.body);
  const result = await createAlunoWithUserRecord(validatedData);

  res.status(201).json({
    success: true,
    message: 'Aluno criado com sucesso',
    data: result,
  });
});

// Custom method to get aluno with complete information
const getAlunoComplete = asyncHandler(async (req: Request, res: Response) => {
  const ra = req.params.id;
  const data = await getAlunoCompleteByRa(ra);
  res.json({
    success: true,
    data,
  });
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /alunos - List all alunos using EnhancedCrudFactory but with custom processing
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 50,
    search = '',
    sortBy = 'ra',
    sortOrder = 'asc',
    coorteId,
  } = req.query as any;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 100);
  const offset = (pageNum - 1) * limitNum;

  const baseQuery = db
    .select()
    .from(alunos)
    .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
    .leftJoin(cursos, eq(alunos.cursoId, cursos.id))
    .leftJoin(periodos, eq(alunos.periodoId, periodos.id))
    .leftJoin(coortes, eq(alunos.coorteId, coortes.id));

  const whereConditions = [] as any[];

  if (coorteId !== undefined) {
    const parsedCoorteId = Number(coorteId);
    if (!Number.isNaN(parsedCoorteId)) {
      whereConditions.push(eq(alunos.coorteId, parsedCoorteId));
    }
  }

  if (search) {
    whereConditions.push(
      or(
        like(alunos.ra, `%${search}%`),
        like(pessoas.nomeCompleto, `%${search}%`),
        like(pessoas.email, `%${search}%`),
        like(cursos.nome, `%${search}%`),
        like(periodos.nome, `%${search}%`)
      )
    );
  }

  const whereExpr =
    whereConditions.length === 1
      ? whereConditions[0]
      : whereConditions.length > 1
        ? and(...whereConditions)
        : undefined;

  const query = whereExpr ? baseQuery.where(whereExpr) : baseQuery;

  // Add ordering
  const orderDirection = sortOrder === 'desc' ? desc : asc;
  const orderByExpr = orderDirection(alunos.ra);
  
  const finalQuery = query.orderBy(orderByExpr);

  // Get data with pagination
  const rawData = await finalQuery.limit(limitNum).offset(offset);

  // Process data to match frontend expected structure
  const data = rawData.map((row: any) => ({
    ra: row.alunos.ra,
    pessoaId: row.alunos.pessoaId,
    cursoId: row.alunos.cursoId,
    coorteId: row.alunos.coorteId,
    periodoId: row.alunos.periodoId,
    turnoId: row.alunos.turnoId,
    anoIngresso: row.alunos.anoIngresso,
    igreja: row.alunos.igreja,
    situacao: row.alunos.situacao,
    coeficienteAcad: row.alunos.coeficienteAcad,
    createdAt: row.alunos.createdAt,
    updatedAt: row.alunos.updatedAt,
    pessoa: row.pessoas
      ? {
          id: row.pessoas.id,
          nome: row.pessoas.nomeCompleto,
          sexo: row.pessoas.sexo,
          email: row.pessoas.email,
          cpf: row.pessoas.cpf,
          data_nascimento: row.pessoas.dataNasc,
          telefone: row.pessoas.telefone,
          endereco: row.pessoas.endereco,
        }
      : null,
    curso: row.cursos
      ? {
          id: row.cursos.id,
          nome: row.cursos.nome,
          grau: row.cursos.grau,
        }
      : null,
    periodo: row.periodos
      ? {
          id: row.periodos.id,
          numero: row.periodos.numero,
          nome: row.periodos.nome,
        }
      : null,
    coorte: row.coortes
      ? {
          id: row.coortes.id,
          cursoId: row.coortes.cursoId,
          turnoId: row.coortes.turnoId,
          curriculoId: row.coortes.curriculoId,
          anoIngresso: row.coortes.anoIngresso,
          rotulo: row.coortes.rotulo,
          ativo: row.coortes.ativo,
        }
      : null,
  }));

  // Get total count for pagination
  const baseCountQuery = db
    .select({ count: sql`count(*)` })
    .from(alunos)
    .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
    .leftJoin(cursos, eq(alunos.cursoId, cursos.id))
    .leftJoin(periodos, eq(alunos.periodoId, periodos.id))
    .leftJoin(coortes, eq(alunos.coorteId, coortes.id));

  const countQuery = whereExpr ? baseCountQuery.where(whereExpr) : baseCountQuery;

  const [{ count }] = await countQuery;
  const total = parseInt(count as string);
  const totalPages = Math.ceil(total / limitNum);

  res.json({
    success: true,
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
    message: `Found ${data.length} records`,
  });
}));

// GET /alunos/:id - Get aluno by RA with complete information
router.get('/:id', validateParams(StringIdParamSchema), getAlunoComplete);

// POST /alunos - Create new aluno with optional user creation
router.post('/', requireSecretaria, createAlunoWithUser);

// PATCH /alunos/:id - Update aluno (requires ADMIN or SECRETARIA)
const updateAlunoHandler = asyncHandler(async (req: Request, res: Response) => {
  const ra = req.params.id;
  const payload = UpdateAlunoSchema.parse(req.body);

  const existing = await db.select().from(alunos).where(eq(alunos.ra, ra)).limit(1);
  if (existing.length === 0) {
    throw createError('Aluno not found', 404);
  }

  // Build dataToUpdate: include all fields from payload, converting undefined to null for nullable fields
  const dataToUpdate: any = {};
  
  // Copy all fields from payload, handling undefined for nullable fields
  for (const [key, value] of Object.entries(payload)) {
    // For nullable fields (coorteId, turnoId, periodoId), convert undefined to null
    if ((key === 'coorteId' || key === 'turnoId' || key === 'periodoId') && value === undefined) {
      dataToUpdate[key] = null;
    } else if (value !== undefined) {
      dataToUpdate[key] = value;
    }
  }

  const cursoId = (dataToUpdate.cursoId as number | undefined) ?? existing[0].cursoId;
  const periodoId = (dataToUpdate.periodoId as number | undefined) ?? existing[0].periodoId;

  await assertPeriodoBelongsToCurso(cursoId, periodoId);

  if (Object.keys(dataToUpdate).length === 0) {
    throw createError('No valid fields to update', 400);
  }

  const [updated] = await db
    .update(alunos)
    .set({
      ...dataToUpdate,
      updatedAt: new Date(),
    })
    .where(eq(alunos.ra, ra))
    .returning();

  res.json({
    success: true,
    message: 'Aluno atualizado com sucesso',
    data: updated,
  });
});

router.patch('/:id', validateParams(StringIdParamSchema), requireSecretaria, updateAlunoHandler);

// DELETE /alunos/:id - Delete aluno (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(StringIdParamSchema), requireSecretaria, alunosCrud.delete);

export default router; 