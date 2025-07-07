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

// GET /turmas - List all turmas
router.get('/', turmasCrud.getAll);

// GET /turmas/:id - Get turma by ID
router.get('/:id', validateParams(IdParamSchema), turmasCrud.getById);

// POST /turmas - Create new turma
router.post('/', turmasCrud.create);

// PATCH /turmas/:id - Update turma
router.patch('/:id', validateParams(IdParamSchema), turmasCrud.update);

// DELETE /turmas/:id - Delete turma
router.delete('/:id', validateParams(IdParamSchema), turmasCrud.delete);

export default router; 