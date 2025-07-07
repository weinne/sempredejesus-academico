import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { professores } from '../db/schema';
import { CreateProfessorSchema, UpdateProfessorSchema, StringIdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireProfessor } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for professores (simplified)
const professoresCrud = new SimpleCrudFactory({
  table: professores,
  createSchema: CreateProfessorSchema,
  updateSchema: UpdateProfessorSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /professores - List all professores (any authenticated user can view)
router.get('/', professoresCrud.getAll);

// GET /professores/:id - Get professor by matricula (any authenticated user can view)
router.get('/:id', validateParams(StringIdParamSchema), professoresCrud.getById);

// POST /professores - Create new professor (requires ADMIN or SECRETARIA)
router.post('/', requireSecretaria, professoresCrud.create);

// PATCH /professores/:id - Update professor (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(StringIdParamSchema), requireSecretaria, professoresCrud.update);

// DELETE /professores/:id - Delete professor (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(StringIdParamSchema), requireSecretaria, professoresCrud.delete);

export default router; 