/**
 * @swagger
 * tags:
 *   - name: Relatórios
 *     description: Relatórios acadêmicos
 */
import { Router, Request, Response } from 'express';
import { and, eq, gte, lte, desc, inArray } from 'drizzle-orm';
import { db } from '../db';
import {
  turmas,
  turmasInscritos,
  disciplinas,
  semestres,
  alunos,
  pessoas,
  avaliacoes,
  avaliacoesAlunos,
  aulas,
  frequencias,
} from '../db/schema';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

// GET /reports/historico?alunoId=RA
/**
 * @swagger
 * /api/reports/historico:
 *   get:
 *     tags: [Relatórios]
 *     summary: Histórico acadêmico do aluno
 *     parameters:
 *       - in: query
 *         name: alunoId
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       200:
 *         description: Histórico por disciplina/semestre
 */
router.get(
  '/historico',
  asyncHandler(async (req: Request, res: Response) => {
    const alunoId = String(req.query.alunoId || '').trim();
    if (!alunoId) throw createError('alunoId é obrigatório', 400);

    // Turmas nas quais o aluno está inscrito
    const inscricoes = await db
      .select({
        inscricaoId: turmasInscritos.id,
        turmaId: turmasInscritos.turmaId,
        media: turmasInscritos.media,
        frequencia: turmasInscritos.frequencia,
        status: turmasInscritos.status,
        disciplinaId: turmas.disciplinaId,
        disciplinaNome: disciplinas.nome,
        semestreId: turmas.semestreId,
        ano: semestres.ano,
        periodo: semestres.periodo,
      })
      .from(turmasInscritos)
      .leftJoin(turmas, eq(turmasInscritos.turmaId, turmas.id))
      .leftJoin(disciplinas, eq(turmas.disciplinaId, disciplinas.id))
      .leftJoin(semestres, eq(turmas.semestreId, semestres.id))
      .where(eq(turmasInscritos.alunoId, alunoId))
      .orderBy(desc(semestres.ano), desc(semestres.periodo));

    // Para cada turma, traz notas detalhadas
    const resultado = [] as any[];
    for (const it of inscricoes) {
      const notas = await db
        .select({
          avaliacaoId: avaliacoes.id,
          data: avaliacoes.data,
          tipo: avaliacoes.tipo,
          descricao: avaliacoes.descricao,
          peso: avaliacoes.peso,
          nota: avaliacoesAlunos.nota,
          obs: avaliacoesAlunos.obs,
        })
        .from(avaliacoes)
        .leftJoin(avaliacoesAlunos, eq(avaliacoesAlunos.avaliacaoId, avaliacoes.id))
        .where(and(eq(avaliacoes.turmaId, it.turmaId), eq(avaliacoesAlunos.alunoId, alunoId)));

      resultado.push({ ...it, notas });
    }

    res.json({ success: true, data: resultado });
  })
);

// GET /reports/frequencia?turmaId=1&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
/**
 * @swagger
 * /api/reports/frequencia:
 *   get:
 *     tags: [Relatórios]
 *     summary: Relatório de frequência por turma
 *     parameters:
 *       - in: query
 *         name: turmaId
 *         schema: { type: integer }
 *         required: true
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Frequências consolidadas por aluno
 */
router.get(
  '/frequencia',
  asyncHandler(async (req: Request, res: Response) => {
    const turmaId = Number(req.query.turmaId);
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
    if (!turmaId || Number.isNaN(turmaId)) throw createError('turmaId é obrigatório', 400);

    // Aulas do período
    const conds: any[] = [eq(aulas.turmaId, turmaId) as any];
    if (startDate) conds.push(gte(aulas.data, startDate as any));
    if (endDate) conds.push(lte(aulas.data, endDate as any));
    const whereAula = and(...(conds as any));

    const aulasPeriodo = await db.select({ id: aulas.id }).from(aulas).where(whereAula as any);
    const totalAulas = aulasPeriodo.length || 0;

    // Inscritos na turma
    const inscritos = await db
      .select({
        inscricaoId: turmasInscritos.id,
        alunoId: turmasInscritos.alunoId,
        ra: alunos.ra,
        nome: pessoas.nomeCompleto,
      })
      .from(turmasInscritos)
      .leftJoin(alunos, eq(turmasInscritos.alunoId, alunos.ra))
      .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
      .where(eq(turmasInscritos.turmaId, turmaId));

    // Computa presenças por aluno
    const data = [] as any[];
    for (const i of inscritos) {
      const presencas = await db
        .select({ id: frequencias.id })
        .from(frequencias)
        .leftJoin(aulas, eq(frequencias.aulaId, aulas.id))
        .where(
          and(
            eq(aulas.turmaId, turmaId),
            eq(frequencias.inscricaoId, i.inscricaoId),
            eq(frequencias.presente, true)
          )
        );
      const perc = totalAulas > 0 ? Math.round((presencas.length / totalAulas) * 10000) / 100 : 0;
      data.push({ alunoId: i.alunoId, ra: i.ra, nome: i.nome, presencas: presencas.length, totalAulas, frequencia: perc });
    }

    res.json({ success: true, data, meta: { totalAulas } });
  })
);

// GET /reports/desempenho?disciplinaId=1&semestreId=1
/**
 * @swagger
 * /api/reports/desempenho:
 *   get:
 *     tags: [Relatórios]
 *     summary: Desempenho por disciplina e semestre
 *     parameters:
 *       - in: query
 *         name: disciplinaId
 *         schema: { type: integer }
 *         required: true
 *       - in: query
 *         name: semestreId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Média geral dos inscritos
 */
router.get(
  '/desempenho',
  asyncHandler(async (req: Request, res: Response) => {
    const disciplinaId = Number(req.query.disciplinaId);
    const semestreId = Number(req.query.semestreId);
    if (!disciplinaId || !semestreId) {
      throw createError('disciplinaId e semestreId são obrigatórios', 400);
    }

    // Turmas da disciplina no semestre
    const ts = await db
      .select({ id: turmas.id })
      .from(turmas)
      .where(and(eq(turmas.disciplinaId, disciplinaId), eq(turmas.semestreId, semestreId)));

    const turmaIds = ts.map((t) => t.id);
    if (turmaIds.length === 0) return res.json({ success: true, data: { turmas: 0, alunos: 0, mediaGeral: null } });

    // Médias dos inscritos dessas turmas
    const inscritos = await db
      .select({ media: turmasInscritos.media })
      .from(turmasInscritos)
      .where(inArray(turmasInscritos.turmaId, turmaIds));

    const mediasNum = inscritos
      .map((r) => (r.media != null ? Number(r.media) : NaN))
      .filter((n) => !Number.isNaN(n));
    const mediaGeral = mediasNum.length > 0 ? Math.round((mediasNum.reduce((a, b) => a + b, 0) / mediasNum.length) * 10) / 10 : null;

    res.json({ success: true, data: { turmas: turmaIds.length, alunos: inscritos.length, mediaGeral } });
  })
);

export default router;
