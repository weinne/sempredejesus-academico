import { Router, Request, Response } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { coortes, cursos, turnos, curriculos } from '../db/schema';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { CreateCoorteSchema, UpdateCoorteSchema, IdParamSchema } from '@seminario/shared-dtos';
import { validateParams } from '../middleware/validation.middleware';
import { db } from '../db';
import { and, eq } from 'drizzle-orm';
import { asyncHandler, createError } from '../middleware/error.middleware';

const router = Router();
router.use(requireAuth);

const crud = new SimpleCrudFactory({ table: coortes, createSchema: CreateCoorteSchema, updateSchema: UpdateCoorteSchema });

// GET /coortes - support filters by cursoId and turnoId
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { cursoId, turnoId } = req.query as { cursoId?: string; turnoId?: string };

    const conditions: any[] = [];
    if (cursoId) conditions.push(eq(coortes.cursoId, Number(cursoId)));
    if (turnoId) conditions.push(eq(coortes.turnoId, Number(turnoId)));

    const baseQuery = db
      .select({
        id: coortes.id,
        cursoId: coortes.cursoId,
        turnoId: coortes.turnoId,
        curriculoId: coortes.curriculoId,
        anoIngresso: coortes.anoIngresso,
        rotulo: coortes.rotulo,
        ativo: coortes.ativo,
        curso: {
          id: cursos.id,
          nome: cursos.nome,
          grau: cursos.grau,
        },
        turno: {
          id: turnos.id,
          nome: turnos.nome,
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
      })
      .from(coortes)
      .leftJoin(cursos, eq(coortes.cursoId, cursos.id))
      .leftJoin(turnos, eq(coortes.turnoId, turnos.id))
      .leftJoin(curriculos, eq(coortes.curriculoId, curriculos.id));

    const rows = conditions.length === 1
      ? await baseQuery.where(conditions[0])
      : conditions.length > 1
      ? await baseQuery.where(and(...conditions))
      : await baseQuery;

    const data = rows.map((row) => ({
      id: row.id,
      cursoId: row.cursoId,
      turnoId: row.turnoId,
      curriculoId: row.curriculoId,
      anoIngresso: row.anoIngresso,
      rotulo: row.rotulo,
      ativo: row.ativo,
      curso: row.curso?.id
        ? {
            id: row.curso.id,
            nome: row.curso.nome,
            grau: row.curso.grau,
          }
        : null,
      turno: row.turno?.id ? { id: row.turno.id, nome: row.turno.nome } : null,
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
    }));

    res.json({ success: true, data });
  })
);

// GET /coortes/:id - get single coorte with relationships
router.get(
  '/:id',
  validateParams(IdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    const rows = await db
      .select({
        id: coortes.id,
        cursoId: coortes.cursoId,
        turnoId: coortes.turnoId,
        curriculoId: coortes.curriculoId,
        anoIngresso: coortes.anoIngresso,
        rotulo: coortes.rotulo,
        ativo: coortes.ativo,
        curso: {
          id: cursos.id,
          nome: cursos.nome,
          grau: cursos.grau,
        },
        turno: {
          id: turnos.id,
          nome: turnos.nome,
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
      })
      .from(coortes)
      .leftJoin(cursos, eq(coortes.cursoId, cursos.id))
      .leftJoin(turnos, eq(coortes.turnoId, turnos.id))
      .leftJoin(curriculos, eq(coortes.curriculoId, curriculos.id))
      .where(eq(coortes.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw createError('Coorte não encontrada', 404);
    }

    const row = rows[0];
    const data = {
      id: row.id,
      cursoId: row.cursoId,
      turnoId: row.turnoId,
      curriculoId: row.curriculoId,
      anoIngresso: row.anoIngresso,
      rotulo: row.rotulo,
      ativo: row.ativo,
      curso: row.curso?.id
        ? {
            id: row.curso.id,
            nome: row.curso.nome,
            grau: row.curso.grau,
          }
        : null,
      turno: row.turno?.id ? { id: row.turno.id, nome: row.turno.nome } : null,
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
    };

    res.json({ success: true, data });
  })
);
router.post('/', requireSecretaria, crud.create);
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, crud.update);
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, crud.delete);

export default router;


