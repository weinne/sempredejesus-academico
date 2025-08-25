/**
 * @swagger
 * tags:
 *   - name: Calendário
 *     description: Eventos e prazos acadêmicos
 */
import { Router } from 'express';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { calendario } from '../db/schema';
import { CreateCalendarioSchema, UpdateCalendarioSchema, IdParamSchema } from '@seminario/shared-dtos';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

router.use(requireAuth);

const crud = new SimpleCrudFactory({
  table: calendario,
  createSchema: CreateCalendarioSchema,
  updateSchema: UpdateCalendarioSchema,
});

// List / Create (SECRETARIA/ADMIN)
/**
 * @swagger
 * /api/calendario:
 *   get:
 *     tags: [Calendário]
 *     summary: Lista eventos do calendário acadêmico
 *     responses:
 *       200:
 *         description: Lista de eventos
 */
router.get('/', crud.getAll);
/**
 * @swagger
 * /api/calendario:
 *   post:
 *     tags: [Calendário]
 *     summary: Cria evento no calendário
 *     responses:
 *       201:
 *         description: Evento criado
 */
router.post('/', requireSecretaria, crud.create);

// Get/Update/Delete by ID
/**
 * @swagger
 * /api/calendario/{id}:
 *   get:
 *     tags: [Calendário]
 *     summary: Busca evento por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Evento retornado
 */
router.get('/:id', validateParams(IdParamSchema), crud.getById);
/**
 * @swagger
 * /api/calendario/{id}:
 *   patch:
 *     tags: [Calendário]
 *     summary: Atualiza evento do calendário
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Evento atualizado
 */
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, crud.update);
/**
 * @swagger
 * /api/calendario/{id}:
 *   delete:
 *     tags: [Calendário]
 *     summary: Remove evento do calendário
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Evento removido
 */
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, crud.delete);

export default router;
