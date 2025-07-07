import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { pessoas } from '../db/schema';
import { CreatePessoaSchema, UpdatePessoaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for pessoas (simplified version)
const pessoasCrud = new SimpleCrudFactory({
  table: pessoas,
  createSchema: CreatePessoaSchema,
  updateSchema: UpdatePessoaSchema,
});

// TEMP: Authentication middleware disabled for testing
// router.use(requireAuth);

// GET /pessoas - List all pessoas
router.get('/', pessoasCrud.getAll);

// GET /pessoas/:id - Get pessoa by ID
router.get('/:id', validateParams(IdParamSchema), pessoasCrud.getById);

// POST /pessoas - Create new pessoa
router.post('/', pessoasCrud.create);

// PATCH /pessoas/:id - Update pessoa
router.patch('/:id', validateParams(IdParamSchema), pessoasCrud.update);

// DELETE /pessoas/:id - Delete pessoa
router.delete('/:id', validateParams(IdParamSchema), pessoasCrud.delete);

export default router; 