import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { turnos } from '../db/schema';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { CreateTurnoSchema, UpdateTurnoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();
router.use(requireAuth);

const crud = new SimpleCrudFactory({ table: turnos, createSchema: CreateTurnoSchema, updateSchema: UpdateTurnoSchema });

router.get('/', crud.getAll);
router.get('/:id', validateParams(IdParamSchema), crud.getById);
router.post('/', requireSecretaria, crud.create);
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, crud.update);
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, crud.delete);

export default router;


