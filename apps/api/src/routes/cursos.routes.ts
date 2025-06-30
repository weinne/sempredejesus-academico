import { Router } from 'express';
import { CrudFactory } from '../core/crud.factory';
import { cursos } from '../db/schema';
import { CreateCursoSchema, UpdateCursoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for cursos
const cursosCrud = new CrudFactory({
  table: cursos,
  createSchema: CreateCursoSchema,
  updateSchema: UpdateCursoSchema,
  searchFields: ['nome', 'grau'],
  allowedFilters: ['grau'],
  defaultLimit: 10,
  maxLimit: 100,
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /cursos - List all cursos
router.get('/', requireAluno, cursosCrud.getAll);

// GET /cursos/:id - Get curso by ID
router.get('/:id', validateParams(IdParamSchema), requireAluno, cursosCrud.getById);

// POST /cursos - Create new curso
router.post('/', requireSecretaria, cursosCrud.create);

// PATCH /cursos/:id - Update curso
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, cursosCrud.update);

// DELETE /cursos/:id - Delete curso
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, cursosCrud.delete);

export default router; 