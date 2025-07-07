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

// TEMP: Authentication middleware disabled for testing
// router.use(requireAuth);

// GET /cursos - List all cursos
router.get('/', cursosCrud.getAll);

// GET /cursos/:id - Get curso by ID
router.get('/:id', validateParams(IdParamSchema), cursosCrud.getById);

// POST /cursos - Create new curso
router.post('/', cursosCrud.create);

// PATCH /cursos/:id - Update curso
router.patch('/:id', validateParams(IdParamSchema), cursosCrud.update);

// DELETE /cursos/:id - Delete curso
router.delete('/:id', validateParams(IdParamSchema), cursosCrud.delete);

export default router; 