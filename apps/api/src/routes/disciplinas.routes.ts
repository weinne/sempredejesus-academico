import { Router } from 'express';
import { CrudFactory } from '../core/crud.factory';
import { disciplinas } from '../db/schema';
import { CreateDisciplinaSchema, UpdateDisciplinaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for disciplinas
const disciplinasCrud = new CrudFactory({
  table: disciplinas,
  createSchema: CreateDisciplinaSchema,
  updateSchema: UpdateDisciplinaSchema,
  searchFields: ['nome', 'codigo'],
  allowedFilters: ['cursoId', 'ativo', 'creditos'],
  defaultLimit: 10,
  maxLimit: 100,
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /disciplinas - List all disciplinas
router.get('/', requireAluno, disciplinasCrud.getAll);

// GET /disciplinas/:id - Get disciplina by ID
router.get('/:id', validateParams(IdParamSchema), requireAluno, disciplinasCrud.getById);

// POST /disciplinas - Create new disciplina
router.post('/', requireSecretaria, disciplinasCrud.create);

// PATCH /disciplinas/:id - Update disciplina
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, disciplinasCrud.update);

// DELETE /disciplinas/:id - Delete disciplina
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, disciplinasCrud.delete);

export default router; 