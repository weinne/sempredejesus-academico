import { Router } from 'express';
import { CrudFactory } from '../core/crud.factory';
import { alunos } from '../db/schema';
import { CreateAlunoSchema, UpdateAlunoSchema, StringIdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for alunos
const alunosCrud = new CrudFactory({
  table: alunos,
  createSchema: CreateAlunoSchema,
  updateSchema: UpdateAlunoSchema,
  searchFields: ['ra'],
  allowedFilters: ['situacao', 'cursoId', 'anoIngresso'],
  defaultLimit: 10,
  maxLimit: 100,
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /alunos - List all alunos (secretaria/admin only)
router.get('/', requireSecretaria, alunosCrud.getAll);

// GET /alunos/:id - Get aluno by RA
router.get('/:id', validateParams(StringIdParamSchema), requireAluno, alunosCrud.getById);

// POST /alunos - Create new aluno
router.post('/', requireSecretaria, alunosCrud.create);

// PATCH /alunos/:id - Update aluno
router.patch('/:id', validateParams(StringIdParamSchema), requireSecretaria, alunosCrud.update);

// DELETE /alunos/:id - Delete aluno
router.delete('/:id', validateParams(StringIdParamSchema), requireSecretaria, alunosCrud.delete);

export default router; 