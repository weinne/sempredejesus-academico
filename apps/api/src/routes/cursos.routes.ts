import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { cursos } from '../db/schema';
import { CreateCursoSchema, UpdateCursoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria, requireAluno } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// Create CRUD factory for cursos (simplified)
const cursosCrud = new SimpleCrudFactory({
  table: cursos,
  createSchema: CreateCursoSchema,
  updateSchema: UpdateCursoSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /cursos - List all cursos (any authenticated user can view)
router.get('/', cursosCrud.getAll);

// GET /cursos/:id - Get curso by ID (any authenticated user can view)
router.get('/:id', validateParams(IdParamSchema), cursosCrud.getById);

// POST /cursos - Create new curso (requires ADMIN or SECRETARIA)
router.post('/', requireSecretaria, cursosCrud.create);

// PATCH /cursos/:id - Update curso (requires ADMIN or SECRETARIA)
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, cursosCrud.update);

// DELETE /cursos/:id - Delete curso (requires ADMIN or SECRETARIA)
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, cursosCrud.delete);

export default router; 