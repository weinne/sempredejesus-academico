import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { disciplinas } from '../db/schema';
import { CreateDisciplinaSchema, UpdateDisciplinaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for disciplinas (simplified)
const disciplinasCrud = new SimpleCrudFactory({
  table: disciplinas,
  createSchema: CreateDisciplinaSchema,
  updateSchema: UpdateDisciplinaSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /disciplinas - List all disciplinas
router.get('/', disciplinasCrud.getAll);

// GET /disciplinas/:id - Get disciplina by ID
router.get('/:id', validateParams(IdParamSchema), disciplinasCrud.getById);

// POST /disciplinas - Create new disciplina
router.post('/', disciplinasCrud.create);

// PATCH /disciplinas/:id - Update disciplina
router.patch('/:id', validateParams(IdParamSchema), disciplinasCrud.update);

// DELETE /disciplinas/:id - Delete disciplina
router.delete('/:id', validateParams(IdParamSchema), disciplinasCrud.delete);

export default router; 