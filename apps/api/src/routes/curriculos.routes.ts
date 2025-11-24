import { Router, Request, Response } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { curriculos, cursos, turnos } from '../db/schema';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { CreateCurriculoSchema, UpdateCurriculoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { validateParams } from '../middleware/validation.middleware';
import { db } from '../db';
import { and, eq } from 'drizzle-orm';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();
router.use(requireAuth);

const crud = new SimpleCrudFactory({ table: curriculos, createSchema: CreateCurriculoSchema, updateSchema: UpdateCurriculoSchema });

// GET /curriculos - supports filtering by cursoId, turnoId and ativo
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { cursoId, turnoId, ativo } = req.query as {
      cursoId?: string;
      turnoId?: string;
      ativo?: string;
    };

    const conditions: any[] = [];
    if (cursoId) conditions.push(eq(curriculos.cursoId, Number(cursoId)));
    if (turnoId) conditions.push(eq(curriculos.turnoId, Number(turnoId)));
    if (typeof ativo !== 'undefined') {
      const ativoBool = ativo === 'true' || ativo === '1';
      conditions.push(eq(curriculos.ativo, ativoBool));
    }

    const baseQuery = db
      .select({
        id: curriculos.id,
        cursoId: curriculos.cursoId,
        turnoId: curriculos.turnoId,
        versao: curriculos.versao,
        vigenteDe: curriculos.vigenteDe,
        vigenteAte: curriculos.vigenteAte,
        ativo: curriculos.ativo,
        curso: {
          id: cursos.id,
          nome: cursos.nome,
          grau: cursos.grau,
        },
        turno: {
          id: turnos.id,
          nome: turnos.nome,
        },
      })
      .from(curriculos)
      .leftJoin(cursos, eq(curriculos.cursoId, cursos.id))
      .leftJoin(turnos, eq(curriculos.turnoId, turnos.id));

    const rows = conditions.length === 1
      ? await baseQuery.where(conditions[0])
      : conditions.length > 1
      ? await baseQuery.where(and(...conditions))
      : await baseQuery;

    const data = rows.map((row) => ({
      id: row.id,
      cursoId: row.cursoId,
      turnoId: row.turnoId,
      versao: row.versao,
      vigenteDe: row.vigenteDe,
      vigenteAte: row.vigenteAte,
      ativo: row.ativo,
      curso: row.curso?.id
        ? {
            id: row.curso.id,
            nome: row.curso.nome,
            grau: row.curso.grau,
          }
        : null,
      turno: row.turno?.id ? { id: row.turno.id, nome: row.turno.nome } : null,
    }));

    res.json({ success: true, data });
  })
);
router.get('/:id', validateParams(IdParamSchema), crud.getById);
router.post('/', requireSecretaria, crud.create);
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, crud.update);
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, crud.delete);

export default router;


