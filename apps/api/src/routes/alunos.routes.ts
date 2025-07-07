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

// TEMP: Authentication middleware disabled for testing
// router.use(requireAuth);

// GET /alunos - List all alunos
router.get('/', alunosCrud.getAll);

// GET /alunos/:id - Get aluno by RA
router.get('/:id', validateParams(StringIdParamSchema), alunosCrud.getById);

// POST /alunos - Create new aluno
router.post('/', alunosCrud.create);

// PATCH /alunos/:id - Update aluno
router.patch('/:id', validateParams(StringIdParamSchema), alunosCrud.update);

// DELETE /alunos/:id - Delete aluno
router.delete('/:id', validateParams(StringIdParamSchema), alunosCrud.delete);

export default router; 