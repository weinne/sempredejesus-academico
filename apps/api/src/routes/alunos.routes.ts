import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { alunos } from '../db/schema';
import { CreateAlunoSchema, UpdateAlunoSchema, StringIdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for alunos (simplified)
const alunosCrud = new SimpleCrudFactory({
  table: alunos,
  createSchema: CreateAlunoSchema,
  updateSchema: UpdateAlunoSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /alunos - List all alunos (any authenticated user can view)
router.get('/', alunosCrud.getAll);

// GET /alunos/:id - Get aluno by RA (any authenticated user can view)
router.get('/:id', validateParams(StringIdParamSchema), alunosCrud.getById);

// POST /alunos - Create new aluno (requires ADMIN or SECRETARIA)
router.post('/', requireSecretaria, alunosCrud.create);

// PATCH /alunos/:id - Update aluno (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(StringIdParamSchema), requireSecretaria, alunosCrud.update);

// DELETE /alunos/:id - Delete aluno (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(StringIdParamSchema), requireSecretaria, alunosCrud.delete);

export default router; 