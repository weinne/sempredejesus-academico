import { Router } from 'express';
import { CrudFactory } from '../core/crud.factory';
import { pessoas } from '../db/schema';
import { CreatePessoaSchema, UpdatePessoaSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for pessoas
const pessoasCrud = new CrudFactory({
  table: pessoas,
  createSchema: CreatePessoaSchema,
  updateSchema: UpdatePessoaSchema,
  searchFields: ['nomeCompleto', 'email', 'cpf'],
  allowedFilters: ['sexo', 'email'],
  defaultLimit: 10,
  maxLimit: 100,
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /pessoas - List all pessoas with pagination and search
router.get('/', requireSecretaria, pessoasCrud.getAll);

// GET /pessoas/:id - Get pessoa by ID
router.get('/:id', validateParams(IdParamSchema), requireSecretaria, pessoasCrud.getById);

// POST /pessoas - Create new pessoa
router.post('/', requireSecretaria, pessoasCrud.create);

// PATCH /pessoas/:id - Update pessoa
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, pessoasCrud.update);

// DELETE /pessoas/:id - Delete pessoa
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, pessoasCrud.delete);

export default router; 