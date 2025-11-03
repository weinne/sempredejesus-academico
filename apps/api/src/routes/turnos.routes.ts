import { Router, Request, Response } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { turnos, curriculos } from '../db/schema';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { CreateTurnoSchema, UpdateTurnoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { validateParams } from '../middleware/validation.middleware';
import { db } from '../db';
import { and, eq, sql } from 'drizzle-orm';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();
router.use(requireAuth);

const crud = new SimpleCrudFactory({ table: turnos, createSchema: CreateTurnoSchema, updateSchema: UpdateTurnoSchema });

// GET /turnos - supports optional filter by cursoId (via curriculos)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { cursoId } = req.query as { cursoId?: string };

    if (!cursoId) {
      const all = await db.select().from(turnos);
      return res.json({ success: true, data: all });
    }

    const rows = await db
      .select({ id: turnos.id, nome: turnos.nome })
      .from(turnos)
      .leftJoin(curriculos, eq(curriculos.turnoId, turnos.id))
      .where(and(eq(curriculos.cursoId, Number(cursoId))))
      .groupBy(turnos.id, turnos.nome);

    res.json({ success: true, data: rows });
  })
);
router.get('/:id', validateParams(IdParamSchema), crud.getById);
router.post('/', requireSecretaria, crud.create);
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, crud.update);
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, crud.delete);

export default router;


