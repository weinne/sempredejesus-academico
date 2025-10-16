import { Router, Request, Response } from 'express';
import { EnhancedCrudFactory } from '../core/crud.factory.enhanced';
import { alunos, pessoas, cursos, users, periodos, userRoles } from '../db/schema';
import { UpdateAlunoSchema, CreateAlunoWithUserSchema, StringIdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { eq, and, like, asc, desc, sql, or } from 'drizzle-orm';
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

const assertPeriodoBelongsToCurso = async (cursoId: number, periodoId: number | null) => {
  if (periodoId === null) {
    return; // Skip validation if periodoId is null
  }

  const periodo = await db.select().from(periodos).where(eq(periodos.id, periodoId)).limit(1);
  if (periodo.length === 0) {
    throw createError('Período informado não existe', 404);
  }

  if (periodo[0].cursoId !== cursoId) {
    throw createError('O período selecionado não pertence ao curso informado', 400);
  }
};

// Helper function to generate unique RA
const generateUniqueRA = async (anoIngresso: number): Promise<string> => {
  const year = anoIngresso.toString();
  let sequencial = 1;
  let ra: string;
  
  do {
    ra = `${year}${sequencial.toString().padStart(3, '0')}`;
    const existing = await db.select().from(alunos).where(eq(alunos.ra, ra)).limit(1);
    if (existing.length === 0) break;
    sequencial++;
  } while (sequencial <= 999);
  
  if (sequencial > 999) {
    throw createError('Não foi possível gerar RA único para o ano', 400);
  }
  
  return ra;
};

// Custom method to create aluno with automatic pessoa (inline) and user creation
const createAlunoWithUser = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = CreateAlunoWithUserSchema.parse(req.body);
  const { createUser, username, password, ...alunoData } = validatedData as any;

  // Check if RA already exists
  if (alunoData.ra) {
    const existingAluno = await db.select().from(alunos).where(eq(alunos.ra, alunoData.ra)).limit(1);
    if (existingAluno.length > 0) {
      throw createError(`RA ${alunoData.ra} já está em uso`, 400);
    }
  }

  // Generate RA if not provided
  const ra = alunoData.ra || await generateUniqueRA(alunoData.anoIngresso);

  await assertPeriodoBelongsToCurso(alunoData.cursoId, alunoData.periodoId);

  // Convert coeficienteAcad from number to string for database
  const alunoDataForDBBase: any = {
    ...alunoData,
    ra,
    coeficienteAcad: alunoData.coeficienteAcad?.toString(),
  };

  // Start transaction
  const result = await db.transaction(async (tx) => {
    // If pessoa inline was provided, create it first and use its ID
    let finalPessoaId: number | undefined = alunoDataForDBBase.pessoaId;
    if (!finalPessoaId && (alunoDataForDBBase as any).pessoa) {
      const pessoaPayload = (alunoDataForDBBase as any).pessoa;
      const [novaPessoa] = await tx
        .insert(pessoas)
        .values({
          nomeCompleto: pessoaPayload.nomeCompleto,
          sexo: pessoaPayload.sexo,
          email: pessoaPayload.email,
          cpf: pessoaPayload.cpf,
          dataNasc: pessoaPayload.dataNasc,
          telefone: pessoaPayload.telefone,
          endereco: pessoaPayload.endereco,
        })
        .returning();
      finalPessoaId = novaPessoa.id;
    }

    if (!finalPessoaId) {
      throw createError('pessoaId é obrigatório (ou forneça pessoa inline)', 400);
    }

    // If a user already exists for this pessoa, ensure the ALUNO role is present
    const existingUserForPessoa = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.pessoaId, finalPessoaId))
      .limit(1);
    if (existingUserForPessoa.length > 0) {
      await tx
        .insert(userRoles)
        .values({ userId: existingUserForPessoa[0].id, role: 'ALUNO' })
        .onConflictDoNothing();
    }

    const alunoInsertValues = {
      ...alunoDataForDBBase,
      pessoaId: finalPessoaId,
    } as any;
    delete (alunoInsertValues as any).pessoa; // remove inline pessoa if present

    // Create aluno
    const [novoAluno] = await tx
      .insert(alunos)
      .values(alunoInsertValues)
      .returning();

    // Create or upsert user + role
    let novoUser = null;
    if (createUser && username && password) {
      const existingUser = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.pessoaId, finalPessoaId))
        .limit(1);

      const passwordHash = await bcrypt.hash(password, 12);

      if (existingUser.length > 0) {
        const userId = existingUser[0].id;
        await tx
          .insert(userRoles)
          .values({ userId, role: 'ALUNO' })
          .onConflictDoNothing();
        // Optionally update password if desired (skip to avoid surprises)
        const [u] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
        novoUser = u || null;
      } else {
        [novoUser] = await tx
          .insert(users)
          .values({
            pessoaId: finalPessoaId,
            username,
            passwordHash,
            role: 'ALUNO',
            isActive: 'S',
          })
          .returning();

        await tx
          .insert(userRoles)
          .values({ userId: novoUser.id, role: 'ALUNO' })
          .onConflictDoNothing();
      }
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
const getAlunoComplete = asyncHandler(async (req: Request, res: Response) => {
  const ra = req.params.id;

  const result = await db
    .select()
    .from(alunos)
    .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
    .leftJoin(cursos, eq(alunos.cursoId, cursos.id))
    .leftJoin(periodos, eq(alunos.periodoId, periodos.id))
    .where(eq(alunos.ra, ra))
    .limit(1);

  if (result.length === 0) {
    throw createError('Aluno not found', 404);
  }

  const row = result[0];
  
  // Process data to match frontend expected structure
  const data = {
    ra: row.alunos.ra,
    pessoaId: row.alunos.pessoaId,
    cursoId: row.alunos.cursoId,
    anoIngresso: row.alunos.anoIngresso,
    igreja: row.alunos.igreja,
    situacao: row.alunos.situacao,
    coeficienteAcad: row.alunos.coeficienteAcad,
    createdAt: row.alunos.createdAt,
    updatedAt: row.alunos.updatedAt,
    pessoa: row.pessoas ? {
      id: row.pessoas.id,
      nome: row.pessoas.nomeCompleto, // Map nomeCompleto to nome for frontend
      sexo: row.pessoas.sexo,
      email: row.pessoas.email,
      cpf: row.pessoas.cpf,
      data_nascimento: row.pessoas.dataNasc,
      telefone: row.pessoas.telefone,
      endereco: row.pessoas.endereco,
    } : null,
    curso: row.cursos ? {
      id: row.cursos.id,
      nome: row.cursos.nome,
      grau: row.cursos.grau,
    } : null,
    periodo: row.periodos
      ? {
          id: row.periodos.id,
          numero: row.periodos.numero,
          nome: row.periodos.nome,
        }
      : null,
  };

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
    sortOrder = 'asc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 100);
  const offset = (pageNum - 1) * limitNum;

  let query = db
    .select()
    .from(alunos)
    .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
    .leftJoin(cursos, eq(alunos.cursoId, cursos.id))
    .leftJoin(periodos, eq(alunos.periodoId, periodos.id));

  // Add search if specified
  if (search) {
    query = query.where(
      or(
        like(alunos.ra, `%${search}%`),
        like(pessoas.nomeCompleto, `%${search}%`),
        like(pessoas.email, `%${search}%`),
        like(cursos.nome, `%${search}%`),
        like(periodos.nome, `%${search}%`)
      )
    );
  }

  // Add ordering
  const orderDirection = sortOrder === 'desc' ? desc : asc;
  if (sortBy === 'ra') {
    query = query.orderBy(orderDirection(alunos.ra));
  } else {
    query = query.orderBy(orderDirection(alunos.ra)); // Default to RA ordering
  }

  // Get data with pagination
  const rawData = await query.limit(limitNum).offset(offset);

  // Process data to match frontend expected structure
  const data = rawData.map((row: any) => ({
    ra: row.alunos.ra,
    pessoaId: row.alunos.pessoaId,
    cursoId: row.alunos.cursoId,
    anoIngresso: row.alunos.anoIngresso,
    igreja: row.alunos.igreja,
    situacao: row.alunos.situacao,
    coeficienteAcad: row.alunos.coeficienteAcad,
    createdAt: row.alunos.createdAt,
    updatedAt: row.alunos.updatedAt,
    pessoa: row.pessoas ? {
      id: row.pessoas.id,
      nome: row.pessoas.nomeCompleto, // Map nomeCompleto to nome for frontend
      sexo: row.pessoas.sexo,
      email: row.pessoas.email,
      cpf: row.pessoas.cpf,
      data_nascimento: row.pessoas.dataNasc,
      telefone: row.pessoas.telefone,
      endereco: row.pessoas.endereco,
    } : null,
      curso: row.cursos ? {
        id: row.cursos.id,
        nome: row.cursos.nome,
        grau: row.cursos.grau,
      } : null,
      periodo: row.periodos
        ? {
            id: row.periodos.id,
            numero: row.periodos.numero,
            nome: row.periodos.nome,
          }
        : null,
    }));

  // Get total count for pagination
  let countQuery = db
    .select({ count: sql`count(*)` })
    .from(alunos)
    .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
    .leftJoin(cursos, eq(alunos.cursoId, cursos.id))
    .leftJoin(periodos, eq(alunos.periodoId, periodos.id));

  if (search) {
    countQuery = countQuery.where(
      or(
        like(alunos.ra, `%${search}%`),
        like(pessoas.nomeCompleto, `%${search}%`),
        like(pessoas.email, `%${search}%`),
        like(cursos.nome, `%${search}%`),
        like(periodos.nome, `%${search}%`)
      )
    );
  }

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

  const dataToUpdate = Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  );

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