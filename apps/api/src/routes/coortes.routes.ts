import { Router, Request, Response } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { coortes } from '../db/schema';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { CreateCoorteSchema, UpdateCoorteSchema, IdParamSchema } from '@seminario/shared-dtos';
import { validateParams } from '../middleware/validation.middleware';
import { db } from '../db';
import { and, eq } from 'drizzle-orm';
import { asyncHandler } from '../middleware/error.middleware';

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

    const query = conditions.length === 1
      ? db.select().from(coortes).where(conditions[0])
      : conditions.length > 1
      ? db.select().from(coortes).where(and(...conditions))
      : db.select().from(coortes);

    const data = await query;
    res.json({ success: true, data });
  })
);
router.get('/:id', validateParams(IdParamSchema), crud.getById);
router.post('/', requireSecretaria, crud.create);
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, crud.update);
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, crud.delete);

export default router;


