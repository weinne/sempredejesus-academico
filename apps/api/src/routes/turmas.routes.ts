import { Router } from 'express';
import { CrudFactory } from '../core/crud.factory';
import { turmas } from '../db/schema';
import { CreateTurmaSchema, UpdateTurmaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireProfessor } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for turmas
const turmasCrud = new CrudFactory({
  table: turmas,
  createSchema: CreateTurmaSchema,
  updateSchema: UpdateTurmaSchema,
  searchFields: ['sala', 'secao'],
  allowedFilters: ['disciplinaId', 'professorId', 'semestreId'],
  defaultLimit: 10,
  maxLimit: 100,
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /turmas - List all turmas
router.get('/', requireProfessor, turmasCrud.getAll);

// GET /turmas/:id - Get turma by ID
router.get('/:id', validateParams(IdParamSchema), requireProfessor, turmasCrud.getById);

// POST /turmas - Create new turma
router.post('/', requireSecretaria, turmasCrud.create);

// PATCH /turmas/:id - Update turma
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, turmasCrud.update);

// DELETE /turmas/:id - Delete turma
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, turmasCrud.delete);

export default router; 