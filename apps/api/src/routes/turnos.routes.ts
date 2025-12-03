import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import { turnos, curriculos, HorarioTurno } from '../db/schema';
import { requireAuth, requireSecretaria } from '../middleware/auth.middleware';
import { CreateTurnoSchema, UpdateTurnoSchema, IdParamSchema } from '@seminario/shared-dtos';
import { validateParams } from '../middleware/validation.middleware';
import { db } from '../db';
import { and, eq } from 'drizzle-orm';
import { asyncHandler, createError } from '../middleware/error.middleware';

const router = Router();
router.use(requireAuth);

const crud = new SimpleCrudFactory({ table: turnos, createSchema: CreateTurnoSchema, updateSchema: UpdateTurnoSchema });

const toMinutes = (value: string) => {
  const [hour, minute] = value.split(':');
  return Number(hour) * 60 + Number(minute);
};

export const sanitizeHorarios = (value: unknown): HorarioTurno[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw createError('Horários do turno devem ser um array', 400);
  }

  const mapped = value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw createError('Horário inválido', 400);
    }

    const horaInicio = item.horaInicio;
    const horaFim = item.horaFim;

    if (typeof horaInicio !== 'string' || typeof horaFim !== 'string') {
      throw createError('horaInicio e horaFim são obrigatórios', 400);
    }

    return {
      id: typeof item.id === 'string' && item.id.length > 0 ? item.id : randomUUID(),
      ordem: typeof item.ordem === 'number' ? item.ordem : index,
      descricao:
        typeof item.descricao === 'string' && item.descricao.length > 0 ? item.descricao : null,
      horaInicio,
      horaFim,
    };
  });

  mapped.sort((a, b) => {
    const ordemA = a.ordem ?? Number.MAX_SAFE_INTEGER;
    const ordemB = b.ordem ?? Number.MAX_SAFE_INTEGER;
    if (ordemA !== ordemB) {
      return ordemA - ordemB;
    }
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  mapped.forEach((item, index) => {
    const startMinutes = toMinutes(item.horaInicio);
    const endMinutes = toMinutes(item.horaFim);

    if (startMinutes >= endMinutes) {
      throw createError('horaFim deve ser maior que horaInicio', 400);
    }

    if (index > 0) {
      const previous = mapped[index - 1];
      if (toMinutes(previous.horaFim) > startMinutes) {
        throw createError('Horários do turno não podem se sobrepor', 400);
      }
    }

    item.ordem = index + 1;
  });

  return mapped;
};

const withTurnoHorarios =
  (handler: any) =>
  (req: Request, res: Response, next: NextFunction): Promise<void> | void => {
    if (req.body) {
      const sanitized = sanitizeHorarios(req.body.horarios);
      if (sanitized !== undefined) {
        req.body.horarios = sanitized;
      }
    }
    return handler(req, res, next);
  };

// GET /turnos - supports optional filter by cursoId (via curriculos)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { cursoId } = req.query as { cursoId?: string };

    if (!cursoId) {
      const all = await db.select().from(turnos);
      return res.json({ success: true, data: all });
    }

    const rows = await db
      .select({ id: turnos.id, nome: turnos.nome, horarios: turnos.horarios })
      .from(turnos)
      .leftJoin(curriculos, eq(curriculos.turnoId, turnos.id))
      .where(and(eq(curriculos.cursoId, Number(cursoId))))
      .groupBy(turnos.id, turnos.nome, turnos.horarios);

    res.json({ success: true, data: rows });
  })
);
router.get('/:id', validateParams(IdParamSchema), crud.getById);
router.post('/', requireSecretaria, withTurnoHorarios(crud.create));
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, withTurnoHorarios(crud.update));
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, crud.delete);

export default router;


