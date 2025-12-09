import { Router, Request, Response } from 'express';
import {
  DirectusAlunoImportPayload,
  DirectusAlunoImportSchema,
  DirectusProfessorImportPayload,
  DirectusProfessorImportSchema,
} from '@seminario/shared-dtos';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { directusService } from '../services/directus.service';
import { createAlunoWithUserRecord } from '../services/alunos.service';
import { createProfessorWithUserRecord } from '../services/professores.service';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get(
  '/directus/alunos',
  asyncHandler(async (req: Request, res: Response) => {
    const refresh = req.query.refresh === 'true';
    const items = await directusService.getAlunoCandidates(refresh);
    res.json({
      success: true,
      data: {
        items,
        total: items.length,
        fetchedAt: new Date().toISOString(),
      },
    });
  }),
);

router.get(
  '/directus/professores',
  asyncHandler(async (req: Request, res: Response) => {
    const refresh = req.query.refresh === 'true';
    const items = await directusService.getProfessorCandidates(refresh);
    res.json({
      success: true,
      data: {
        items,
        total: items.length,
        fetchedAt: new Date().toISOString(),
      },
    });
  }),
);

router.post(
  '/directus/alunos/importar',
  validateBody(DirectusAlunoImportSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body as DirectusAlunoImportPayload;
    const results: Array<{ sourceId: string; ra: string }> = [];
    for (const item of items) {
      const result = await createAlunoWithUserRecord(item);
      results.push({ sourceId: String(item.sourceId), ra: result.aluno.ra });
    }

    res.status(201).json({
      success: true,
      message: `${results.length} aluno(s) importado(s) com sucesso`,
      data: results,
    });
  }),
);

router.post(
  '/directus/professores/importar',
  validateBody(DirectusProfessorImportSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body as DirectusProfessorImportPayload;
    const results: Array<{ sourceId: string; matricula: string }> = [];
    for (const item of items) {
      const result = await createProfessorWithUserRecord(item);
      results.push({ sourceId: String(item.sourceId), matricula: result.professor.matricula });
    }

    res.status(201).json({
      success: true,
      message: `${results.length} professor(es) importado(s) com sucesso`,
      data: results,
    });
  }),
);

export default router;
