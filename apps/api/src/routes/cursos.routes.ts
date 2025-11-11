import { Router, Request, Response } from 'express';
import { EnhancedCrudFactory } from '../core/crud.factory.enhanced';
import { cursos, disciplinas, periodos, disciplinasPeriodos, curriculos } from '../db/schema';
import { CreateCursoSchema, UpdateCursoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';
import { eq, sql, asc } from 'drizzle-orm';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';

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

// Create Enhanced CRUD factory for cursos
const cursosCrud = new EnhancedCrudFactory({
  table: cursos,
  createSchema: CreateCursoSchema,
  updateSchema: UpdateCursoSchema,
  searchFields: ['nome'], // Search by course name
  orderBy: [{ field: 'nome', direction: 'asc' }],
});

// Custom method to get curso with disciplinas
const getCursoWithDisciplinas = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  // Get curso
  const cursoResult = await db
    .select()
    .from(cursos)
    .where(eq(cursos.id, id))
    .limit(1);

  if (cursoResult.length === 0) {
    throw createError('Curso not found', 404);
  }

  // Get disciplinas for this curso
  const disciplinasResult = await db
    .select({
      id: disciplinas.id,
      codigo: disciplinas.codigo,
      nome: disciplinas.nome,
      creditos: disciplinas.creditos,
      cargaHoraria: disciplinas.cargaHoraria,
      ementa: disciplinas.ementa,
      bibliografia: disciplinas.bibliografia,
      ativo: disciplinas.ativo,
    })
    .from(disciplinas)
    .where(eq(disciplinas.cursoId, id))
    .orderBy(disciplinas.nome);

  const vinculos = await db
    .select({
      disciplinaId: disciplinasPeriodos.disciplinaId,
      periodoId: disciplinasPeriodos.periodoId,
      ordem: disciplinasPeriodos.ordem,
      obrigatoria: disciplinasPeriodos.obrigatoria,
      periodo: {
        id: periodos.id,
        numero: periodos.numero,
        nome: periodos.nome,
        curriculoId: periodos.curriculoId,
      },
    })
    .from(disciplinasPeriodos)
    .innerJoin(periodos, eq(periodos.id, disciplinasPeriodos.periodoId))
    .innerJoin(curriculos, eq(curriculos.id, periodos.curriculoId))
    .where(eq(curriculos.cursoId, id))
    .orderBy(asc(periodos.numero), asc(disciplinasPeriodos.ordem), asc(disciplinasPeriodos.disciplinaId));

  const periodosMap = new Map<number, typeof vinculos>();
  for (const vinculo of vinculos) {
    const list = periodosMap.get(vinculo.disciplinaId) ?? [];
    list.push(vinculo);
    periodosMap.set(vinculo.disciplinaId, list);
  }

  const periodosResult = await db
    .select({
      id: periodos.id,
      numero: periodos.numero,
      nome: periodos.nome,
      descricao: periodos.descricao,
      totalDisciplinas: sql<number>`COUNT(DISTINCT ${disciplinasPeriodos.disciplinaId})`,
    })
    .from(periodos)
    .leftJoin(disciplinasPeriodos, eq(disciplinasPeriodos.periodoId, periodos.id))
    .innerJoin(curriculos, eq(curriculos.id, periodos.curriculoId))
    .where(eq(curriculos.cursoId, id))
    .groupBy(periodos.id, periodos.numero, periodos.nome, periodos.descricao)
    .orderBy(periodos.numero);

  const curso = cursoResult[0];
  const result = {
    ...curso,
    disciplinas: disciplinasResult.map((disciplina) => ({
      ...disciplina,
      periodos: (periodosMap.get(disciplina.id) ?? []).map((vinculo) => ({
        periodoId: vinculo.periodoId,
        ordem: vinculo.ordem ?? undefined,
        obrigatoria: vinculo.obrigatoria,
        periodo: vinculo.periodo,
      })),
    })),
    periodos: periodosResult.map((periodo) => ({
      ...periodo,
      totalDisciplinas: Number(periodo.totalDisciplinas ?? 0),
    })),
    totalPeriodos: periodosResult.length,
    totalDisciplinas: disciplinasResult.length,
    disciplinasAtivas: disciplinasResult.filter(d => d.ativo).length,
    cargaHorariaTotal: disciplinasResult.reduce((total, d) => total + d.cargaHoraria, 0),
  };

  res.json({
    success: true,
    data: result,
  });
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /cursos - List all cursos
router.get('/', cursosCrud.getAll);

// GET /cursos/:id - Get curso by ID with disciplinas
router.get('/:id', validateParams(IdParamSchema), getCursoWithDisciplinas);

// POST /cursos - Create new curso (requires ADMIN or SECRETARIA)
router.post('/', requireSecretaria, validateBody(CreateCursoSchema), cursosCrud.create);

// PATCH /cursos/:id - Update curso (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, validateBody(UpdateCursoSchema), cursosCrud.update);

// DELETE /cursos/:id - Delete curso (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, cursosCrud.delete);

export default router; 