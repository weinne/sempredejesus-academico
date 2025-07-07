import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { turmas } from '../db/schema';
import { CreateTurmaSchema, UpdateTurmaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireProfessor } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for turmas (simplified)
const turmasCrud = new SimpleCrudFactory({
  table: turmas,
  createSchema: CreateTurmaSchema,
  updateSchema: UpdateTurmaSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /turmas - List all turmas (any authenticated user can view)
router.get('/', turmasCrud.getAll);

// GET /turmas/:id - Get turma by ID (any authenticated user can view)
router.get('/:id', validateParams(IdParamSchema), turmasCrud.getById);

// POST /turmas - Create new turma (requires ADMIN, SECRETARIA or PROFESSOR)
router.post('/', requireProfessor, turmasCrud.create);

// PATCH /turmas/:id - Update turma (requires ADMIN, SECRETARIA or PROFESSOR)
router.patch('/:id', validateParams(IdParamSchema), requireProfessor, turmasCrud.update);

// DELETE /turmas/:id - Delete turma (requires ADMIN, SECRETARIA or PROFESSOR)
router.delete('/:id', validateParams(IdParamSchema), requireProfessor, turmasCrud.delete);

export default router; 