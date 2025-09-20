import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { curriculos } from '../db/schema';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { CreateCurriculoSchema, UpdateCurriculoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();
router.use(requireAuth);

const crud = new SimpleCrudFactory({ table: curriculos, createSchema: CreateCurriculoSchema, updateSchema: UpdateCurriculoSchema });

router.get('/', crud.getAll);
router.get('/:id', validateParams(IdParamSchema), crud.getById);
router.post('/', requireSecretaria, crud.create);
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, crud.update);
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, crud.delete);

export default router;


