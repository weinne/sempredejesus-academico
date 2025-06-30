import { Router } from 'express';
import { CrudFactory } from '../core/crud.factory';
import { professores } from '../db/schema';
import { CreateProfessorSchema, UpdateProfessorSchema, StringIdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireProfessor } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for professores
const professoresCrud = new CrudFactory({
  table: professores,
  createSchema: CreateProfessorSchema,
  updateSchema: UpdateProfessorSchema,
  searchFields: ['matricula'],
  allowedFilters: ['situacao'],
  defaultLimit: 10,
  maxLimit: 100,
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /professores - List all professores
router.get('/', requireProfessor, professoresCrud.getAll);

// GET /professores/:id - Get professor by matricula
router.get('/:id', validateParams(StringIdParamSchema), requireProfessor, professoresCrud.getById);

// POST /professores - Create new professor
router.post('/', requireSecretaria, professoresCrud.create);

// PATCH /professores/:id - Update professor
router.patch('/:id', validateParams(StringIdParamSchema), requireSecretaria, professoresCrud.update);

// DELETE /professores/:id - Delete professor
router.delete('/:id', validateParams(StringIdParamSchema), requireSecretaria, professoresCrud.delete);

export default router; 