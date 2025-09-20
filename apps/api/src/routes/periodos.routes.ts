import { Router, Request, Response } from 'express';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { CreatePeriodoSchema, UpdatePeriodoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { periodos, cursos, disciplinas, alunos } from '../db/schema';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { and, eq, like, not, or, sql } from 'drizzle-orm';

const router = Router();

const buildWhereCondition = (cursoId?: number, search?: string) => {
  const conditions = [] as any[];

  if (cursoId) {
    conditions.push(eq(periodos.cursoId, cursoId));
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        like(periodos.nome, term),
        like(cursos.nome, term),
        sql`CAST(${periodos.numero} AS TEXT) LIKE ${term}`
      )
    );
  }

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
};

const listPeriodos = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '50',
    cursoId,
    search = '',
  } = req.query;

  const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 100);
  const offset = (pageNum - 1) * limitNum;
  const cursoIdNumber = cursoId ? parseInt(cursoId as string, 10) : undefined;

  const whereCondition = buildWhereCondition(cursoIdNumber, search as string);

  let query = db
    .select({
      id: periodos.id,
      cursoId: periodos.cursoId,
      numero: periodos.numero,
      nome: periodos.nome,
      descricao: periodos.descricao,
      totalDisciplinas: sql<number>`COUNT(${disciplinas.id})`,
      curso: {
        id: cursos.id,
        nome: cursos.nome,
        grau: cursos.grau,
      },
    })
    .from(periodos)
    .leftJoin(cursos, eq(periodos.cursoId, cursos.id))
    .leftJoin(disciplinas, eq(disciplinas.periodoId, periodos.id));

  if (whereCondition) {
    query = query.where(whereCondition);
  }

  const rows = await query
    .groupBy(
      periodos.id,
      periodos.cursoId,
      periodos.numero,
      periodos.nome,
      periodos.descricao,
      cursos.id,
      cursos.nome,
      cursos.grau
    )
    .orderBy(periodos.numero)
    .limit(limitNum)
    .offset(offset);

  const countQuery = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(periodos)
    .leftJoin(cursos, eq(periodos.cursoId, cursos.id));

  const countRows = whereCondition ? await countQuery.where(whereCondition) : await countQuery;
  const total = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limitNum) || 1;

  const data = rows.map((row) => ({
    id: row.id,
    cursoId: row.cursoId,
    numero: row.numero,
    nome: row.nome,
    descricao: row.descricao,
    totalDisciplinas: Number(row.totalDisciplinas ?? 0),
    curso: row.curso?.id
      ? {
          id: row.curso.id,
          nome: row.curso.nome,
          grau: row.curso.grau,
        }
      : null,
  }));

  res.json({
    success: true,
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
  });
});

const getPeriodo = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const rows = await db
    .select({
      id: periodos.id,
      cursoId: periodos.cursoId,
      numero: periodos.numero,
      nome: periodos.nome,
      descricao: periodos.descricao,
      curso: {
        id: cursos.id,
        nome: cursos.nome,
        grau: cursos.grau,
      },
      totalDisciplinas: sql<number>`COUNT(DISTINCT ${disciplinas.id})`,
      totalAlunos: sql<number>`COUNT(DISTINCT ${alunos.ra})`,
    })
    .from(periodos)
    .leftJoin(cursos, eq(periodos.cursoId, cursos.id))
    .leftJoin(disciplinas, eq(disciplinas.periodoId, periodos.id))
    .leftJoin(alunos, eq(alunos.periodoId, periodos.id))
    .where(eq(periodos.id, id))
    .groupBy(
      periodos.id,
      periodos.cursoId,
      periodos.numero,
      periodos.nome,
      periodos.descricao,
      cursos.id,
      cursos.nome,
      cursos.grau
    );

  if (rows.length === 0) {
    throw createError('Período não encontrado', 404);
  }

  const row = rows[0];

  res.json({
    success: true,
    data: {
      id: row.id,
      cursoId: row.cursoId,
      numero: row.numero,
      nome: row.nome,
      descricao: row.descricao,
      totalDisciplinas: Number(row.totalDisciplinas ?? 0),
      totalAlunos: Number(row.totalAlunos ?? 0),
      curso: row.curso?.id
        ? {
            id: row.curso.id,
            nome: row.curso.nome,
            grau: row.curso.grau,
          }
        : null,
    },
  });
});

const ensureCursoExists = async (cursoId: number) => {
  const exists = await db.select({ id: cursos.id }).from(cursos).where(eq(cursos.id, cursoId)).limit(1);
  if (exists.length === 0) {
    throw createError('Curso informado não existe', 404);
  }
};

const ensureUniquePeriodo = async (cursoId: number, numero: number, ignoreId?: number) => {
  const condition = ignoreId
    ? and(eq(periodos.cursoId, cursoId), eq(periodos.numero, numero), not(eq(periodos.id, ignoreId)))
    : and(eq(periodos.cursoId, cursoId), eq(periodos.numero, numero));

  const existing = await db.select({ id: periodos.id }).from(periodos).where(condition).limit(1);
  if (existing.length > 0) {
    throw createError('Já existe um período com este número para o curso selecionado', 409);
  }
};

const createPeriodo = asyncHandler(async (req: Request, res: Response) => {
  const payload = CreatePeriodoSchema.parse(req.body);

  await ensureCursoExists(payload.cursoId);
  await ensureUniquePeriodo(payload.cursoId, payload.numero);

  const [novoPeriodo] = await db.insert(periodos).values(payload).returning();

  res.status(201).json({
    success: true,
    message: 'Período criado com sucesso',
    data: novoPeriodo,
  });
});

const updatePeriodo = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const payload = UpdatePeriodoSchema.parse(req.body);

  const existingRows = await db.select().from(periodos).where(eq(periodos.id, id)).limit(1);
  if (existingRows.length === 0) {
    throw createError('Período não encontrado', 404);
  }

  const existing = existingRows[0];

  const dataToUpdate = Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(dataToUpdate).length === 0) {
    throw createError('Nenhum campo válido informado para atualização', 400);
  }

  const cursoId = (dataToUpdate.cursoId as number | undefined) ?? existing.cursoId;
  const numero = (dataToUpdate.numero as number | undefined) ?? existing.numero;

  await ensureCursoExists(cursoId);
  await ensureUniquePeriodo(cursoId, numero, id);

  const [updated] = await db
    .update(periodos)
    .set(dataToUpdate)
    .where(eq(periodos.id, id))
    .returning();

  res.json({
    success: true,
    message: 'Período atualizado com sucesso',
    data: updated,
  });
});

const deletePeriodo = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const [existing] = await db.select({ id: periodos.id }).from(periodos).where(eq(periodos.id, id));
  if (!existing) {
    throw createError('Período não encontrado', 404);
  }

  const [{ count: disciplinasCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(disciplinas)
    .where(eq(disciplinas.periodoId, id));

  if (Number(disciplinasCount ?? 0) > 0) {
    throw createError('Não é possível remover um período com disciplinas associadas', 409);
  }

  const [{ count: alunosCount }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(alunos)
    .where(eq(alunos.periodoId, id));

  if (Number(alunosCount ?? 0) > 0) {
    throw createError('Não é possível remover um período com alunos vinculados', 409);
  }

  const [deleted] = await db.delete(periodos).where(eq(periodos.id, id)).returning();

  res.json({
    success: true,
    message: 'Período removido com sucesso',
    data: deleted,
  });
});

router.use(requireAuth);

router.get('/', listPeriodos);
router.get('/:id', validateParams(IdParamSchema), getPeriodo);
router.post('/', requireSecretaria, validateBody(CreatePeriodoSchema), createPeriodo);
router.patch(
  '/:id',
  validateParams(IdParamSchema),
  requireSecretaria,
  validateBody(UpdatePeriodoSchema),
  updatePeriodo
);
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, deletePeriodo);

export default router;
