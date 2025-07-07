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

// TEMP: Authentication middleware disabled for testing
// router.use(requireAuth);

// GET /professores - List all professores
router.get('/', professoresCrud.getAll);

// GET /professores/:id - Get professor by matricula
router.get('/:id', validateParams(StringIdParamSchema), professoresCrud.getById);

// POST /professores - Create new professor
router.post('/', professoresCrud.create);

// PATCH /professores/:id - Update professor
router.patch('/:id', validateParams(StringIdParamSchema), professoresCrud.update);

// DELETE /professores/:id - Delete professor
router.delete('/:id', validateParams(StringIdParamSchema), professoresCrud.delete);

export default router; 