import { Router, Request, Response } from 'express';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { CreatePeriodoSchema, UpdatePeriodoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { periodos, cursos, disciplinas, alunos, turnos, curriculos, disciplinasPeriodos } from '../db/schema';
import { db } from '../db';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { and, asc, eq, like, not, or, sql } from 'drizzle-orm';

const router = Router();

const buildWhereCondition = (cursoId?: number, turnoId?: number, curriculoId?: number, search?: string) => {
  const conditions = [] as any[];

  if (cursoId) {
    conditions.push(eq(curriculos.cursoId, cursoId));
  }

  if (turnoId) {
    conditions.push(eq(curriculos.turnoId, turnoId));
  }

  if (curriculoId) {
    conditions.push(eq(periodos.curriculoId, curriculoId));
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
  const { page = '1', limit = '50', cursoId, turnoId, curriculoId, search = '' } = req.query as any;

  const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 100);
  const offset = (pageNum - 1) * limitNum;
  const cursoIdNumber = cursoId ? parseInt(cursoId as string, 10) : undefined;

  const whereCondition = buildWhereCondition(
    cursoIdNumber,
    turnoId ? Number(turnoId) : undefined,
    curriculoId ? Number(curriculoId) : undefined,
    search as string
  );

  let query = db
    .select({
      id: periodos.id,
      curriculoId: periodos.curriculoId,
      numero: periodos.numero,
      nome: periodos.nome,
      descricao: periodos.descricao,
      totalDisciplinas: sql<number>`COUNT(DISTINCT ${disciplinasPeriodos.disciplinaId})`,
      curso: {
        id: cursos.id,
        nome: cursos.nome,
        grau: cursos.grau,
      },
      curriculo: {
        id: curriculos.id,
        cursoId: curriculos.cursoId,
        turnoId: curriculos.turnoId,
        versao: curriculos.versao,
        vigenteDe: curriculos.vigenteDe,
        vigenteAte: curriculos.vigenteAte,
        ativo: curriculos.ativo,
      },
      turno: {
        id: turnos.id,
        nome: turnos.nome,
      },
    })
    .from(periodos)
    .leftJoin(curriculos, eq(periodos.curriculoId, curriculos.id))
    .leftJoin(cursos, eq(curriculos.cursoId, cursos.id))
    .leftJoin(turnos, eq(curriculos.turnoId, turnos.id))
    .leftJoin(disciplinasPeriodos, eq(disciplinasPeriodos.periodoId, periodos.id));

  const finalQuery = whereCondition
    ? query.where(whereCondition)
    : query;

  const rows = await finalQuery
    .groupBy(
      periodos.id,
      periodos.curriculoId,
      periodos.numero,
      periodos.nome,
      periodos.descricao,
      cursos.id,
      cursos.nome,
      cursos.grau,
      curriculos.id,
      curriculos.cursoId,
      curriculos.turnoId,
      curriculos.versao,
      curriculos.vigenteDe,
      curriculos.vigenteAte,
      curriculos.ativo,
      turnos.id,
      turnos.nome
    )
    .orderBy(asc(periodos.numero))
    .limit(limitNum)
    .offset(offset);

  const countQuery = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(periodos)
    .leftJoin(curriculos, eq(periodos.curriculoId, curriculos.id))
    .leftJoin(cursos, eq(curriculos.cursoId, cursos.id));

  const countRows = whereCondition ? await countQuery.where(whereCondition) : await countQuery;
  const total = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limitNum) || 1;

  const data = rows.map((row) => ({
    id: row.id,
    curriculoId: row.curriculoId,
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
    curriculo: row.curriculo?.id
      ? {
          id: row.curriculo.id,
          cursoId: row.curriculo.cursoId,
          turnoId: row.curriculo.turnoId,
          versao: row.curriculo.versao,
          vigenteDe: row.curriculo.vigenteDe,
          vigenteAte: row.curriculo.vigenteAte,
          ativo: Boolean(row.curriculo.ativo),
        }
      : null,
    turno: row.turno?.id ? { id: row.turno.id, nome: row.turno.nome } : null,
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
      curriculoId: periodos.curriculoId,
      numero: periodos.numero,
      nome: periodos.nome,
      descricao: periodos.descricao,
      curso: {
        id: cursos.id,
        nome: cursos.nome,
        grau: cursos.grau,
      },
      curriculo: {
        id: curriculos.id,
        cursoId: curriculos.cursoId,
        turnoId: curriculos.turnoId,
        versao: curriculos.versao,
        vigenteDe: curriculos.vigenteDe,
        vigenteAte: curriculos.vigenteAte,
        ativo: curriculos.ativo,
      },
      turno: {
        id: turnos.id,
        nome: turnos.nome,
      },
      totalDisciplinas: sql<number>`COUNT(DISTINCT ${disciplinasPeriodos.disciplinaId})`,
      totalAlunos: sql<number>`COUNT(DISTINCT ${alunos.ra})`,
    })
    .from(periodos)
    .leftJoin(curriculos, eq(periodos.curriculoId, curriculos.id))
    .leftJoin(cursos, eq(curriculos.cursoId, cursos.id))
    .leftJoin(turnos, eq(curriculos.turnoId, turnos.id))
    .leftJoin(disciplinasPeriodos, eq(disciplinasPeriodos.periodoId, periodos.id))
    .leftJoin(disciplinas, eq(disciplinas.id, disciplinasPeriodos.disciplinaId))
    .leftJoin(alunos, eq(alunos.periodoId, periodos.id))
    .where(eq(periodos.id, id))
    .groupBy(
      periodos.id,
      periodos.numero,
      periodos.nome,
      periodos.descricao,
      cursos.id,
      cursos.nome,
      cursos.grau,
      curriculos.id,
      curriculos.cursoId,
      curriculos.turnoId,
      curriculos.versao,
      curriculos.vigenteDe,
      curriculos.vigenteAte,
      curriculos.ativo,
      turnos.id,
      turnos.nome
    );

  if (rows.length === 0) {
    throw createError('Período não encontrado', 404);
  }

  const row = rows[0];

  const disciplinasDoPeriodo = await db
    .select({
      id: disciplinas.id,
      codigo: disciplinas.codigo,
      nome: disciplinas.nome,
      creditos: disciplinas.creditos,
      cargaHoraria: disciplinas.cargaHoraria,
      ativo: disciplinas.ativo,
      ordem: disciplinasPeriodos.ordem,
      obrigatoria: disciplinasPeriodos.obrigatoria,
    })
    .from(disciplinasPeriodos)
    .innerJoin(disciplinas, eq(disciplinas.id, disciplinasPeriodos.disciplinaId))
    .where(eq(disciplinasPeriodos.periodoId, id))
    .orderBy(asc(disciplinasPeriodos.ordem), asc(disciplinas.nome));

  res.json({
    success: true,
    data: {
      id: row.id,
      curriculoId: row.curriculoId,
      numero: row.numero,
      nome: row.nome,
      descricao: row.descricao,
      totalDisciplinas: disciplinasDoPeriodo.length,
      totalAlunos: Number(row.totalAlunos ?? 0),
      curso: row.curso?.id
        ? {
            id: row.curso.id,
            nome: row.curso.nome,
            grau: row.curso.grau,
          }
        : null,
      curriculo: row.curriculo?.id
        ? {
            id: row.curriculo.id,
            cursoId: row.curriculo.cursoId,
            turnoId: row.curriculo.turnoId,
            versao: row.curriculo.versao,
            vigenteDe: row.curriculo.vigenteDe,
            vigenteAte: row.curriculo.vigenteAte,
            ativo: Boolean(row.curriculo.ativo),
          }
        : null,
      turno: row.turno?.id ? { id: row.turno.id, nome: row.turno.nome } : null,
      disciplinas: disciplinasDoPeriodo.map((disciplina) => ({
        id: disciplina.id,
        codigo: disciplina.codigo,
        nome: disciplina.nome,
        creditos: disciplina.creditos,
        cargaHoraria: disciplina.cargaHoraria,
        ativo: disciplina.ativo,
        ordem: disciplina.ordem ?? undefined,
        obrigatoria: disciplina.obrigatoria,
      })),
    },
  });
});

const loadCurriculoOrFail = async (curriculoId: number) => {
  const rows = await db
    .select({
      id: curriculos.id,
      cursoId: curriculos.cursoId,
      turnoId: curriculos.turnoId,
      versao: curriculos.versao,
    })
    .from(curriculos)
    .where(eq(curriculos.id, curriculoId))
    .limit(1);

  if (rows.length === 0) {
    throw createError('Currículo informado não existe', 404);
  }

  return rows[0];
};

const ensureUniquePeriodo = async (curriculoId: number, numero: number, ignoreId?: number) => {
  const condition = ignoreId
    ? and(eq(periodos.curriculoId, curriculoId), eq(periodos.numero, numero), not(eq(periodos.id, ignoreId)))
    : and(eq(periodos.curriculoId, curriculoId), eq(periodos.numero, numero));

  const existing = await db.select({ id: periodos.id }).from(periodos).where(condition).limit(1);
  if (existing.length > 0) {
    throw createError('Já existe um período com este número para o currículo selecionado', 409);
  }
};

const createPeriodo = asyncHandler(async (req: Request, res: Response) => {
  const payload = CreatePeriodoSchema.parse(req.body);

  const curriculo = await loadCurriculoOrFail(payload.curriculoId);
  await ensureUniquePeriodo(curriculo.id, payload.numero);

  const [novoPeriodo] = await db
    .insert(periodos)
    .values({
      ...payload,
      curriculoId: curriculo.id,
    })
    .returning();

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
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(dataToUpdate).length === 0) {
    throw createError('Nenhum campo válido informado para atualização', 400);
  }

  const curriculoId = (dataToUpdate.curriculoId as number | undefined) ?? existing.curriculoId;
  const numero = (dataToUpdate.numero as number | undefined) ?? existing.numero;

  const curriculo = await loadCurriculoOrFail(curriculoId);
  await ensureUniquePeriodo(curriculo.id, numero, id);

  Object.assign(dataToUpdate, {
    curriculoId: curriculo.id,
  });

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
    .from(disciplinasPeriodos)
    .where(eq(disciplinasPeriodos.periodoId, id));

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
