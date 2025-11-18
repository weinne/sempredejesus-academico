import { Router, Request, Response } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { curriculos } from '../db/schema';
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

    const query = conditions.length === 1
      ? db.select().from(curriculos).where(conditions[0])
      : conditions.length > 1
      ? db.select().from(curriculos).where(and(...conditions))
      : db.select().from(curriculos);

    // Order by id for stable results
    const data = await query;

    res.json({ success: true, data });
  })
);
router.get('/:id', validateParams(IdParamSchema), crud.getById);
router.post('/', requireSecretaria, crud.create);
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, crud.update);
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, crud.delete);

export default router;


