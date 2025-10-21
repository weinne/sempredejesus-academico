import { Router, Request, Response } from 'express';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import {
  CreateTurmaSchema,
  UpdateTurmaSchema,
  IdParamSchema,
  CreateTurmaInscricaoSchema,
  BulkTurmaInscricaoSchema,
  UpdateTurmaInscricaoSchema,
} from '@seminario/shared-dtos';
import { SimpleCrudFactory } from '../core/crud.factory.simple';
import {
  turmas,
  disciplinas,
  professores,
  pessoas,
  periodos,
  coortes,
  turmasInscritos,
  alunos,
} from '../db/schema';
import { db } from '../db';
import { requireAuth, requireProfessor, requireSecretaria } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateParams } from '../middleware/validation.middleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     Turma:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da turma
 *         codigo:
 *           type: string
 *           description: Código da turma
 *           example: "TSI001-2024.1"
 *         disciplinaId:
 *           type: integer
 *           description: ID da disciplina
 *           example: 1
 *         professorId:
 *           type: string
 *           description: Matrícula do professor responsável
 *           example: "PROF001"
 *         periodoCurricular:
 *           type: string
 *           description: Período curricular derivado da disciplina (somente exibição)
 *           example: "Período 1"
 *         vagas:
 *           type: integer
 *           description: Número de vagas disponíveis
 *           example: 30
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateTurma:
 *       type: object
 *       properties:
 *         codigo:
 *           type: string
 *           description: Código único da turma
 *           example: "TSI001-2024.1"
 *         disciplinaId:
 *           type: integer
 *           description: ID da disciplina
 *           example: 1
 *         professorId:
 *           type: string
 *           description: Matrícula do professor
 *           example: "PROF001"
 *         periodoCurricular:
 *           type: string
 *           description: Período curricular (somente exibição)
 *           example: "Período 1"
 *         vagas:
 *           type: integer
 *           description: Número de vagas
 *           example: 30
 *       required:
 *         - codigo
 *         - disciplinaId
 *         - professorId
 *         - semestre
 */

/**
 * @swagger
 * /api/turmas:
 *   get:
 *     tags: [Turmas]
 *     summary: Lista todas as turmas
 *     description: Retorna lista de turmas cadastradas no sistema
 *     responses:
 *       200:
 *         description: Lista de turmas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Found 8 records"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Turma'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Turmas]
 *     summary: Cria nova turma
 *     description: Cadastra nova turma no sistema (requer permissão ADMIN, SECRETARIA ou PROFESSOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTurma'
 *     responses:
 *       201:
 *         description: Turma criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Resource created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Turma'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Permissão insuficiente (requer ADMIN, SECRETARIA ou PROFESSOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 */

const router = Router();

const alunoPessoa = alias(pessoas, 'aluno_pessoa');
const TurmaInscricaoParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  inscricaoId: z.coerce.number().int().positive(),
});

// Create CRUD factory for turmas (simplified)
const turmasCrud = new SimpleCrudFactory({
  table: turmas,
  createSchema: CreateTurmaSchema,
  updateSchema: UpdateTurmaSchema,
});

// Authentication middleware enabled
router.use(requireAuth);

// GET /turmas - List all turmas (any authenticated user can view)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const turmasRows = await db
      .select({
        turmaId: turmas.id,
        disciplinaId: turmas.disciplinaId,
        professorId: turmas.professorId,
        coorteId: turmas.coorteId,
        sala: turmas.sala,
        horario: turmas.horario,
        secao: turmas.secao,
        disciplinaPk: disciplinas.id,
        disciplinaCodigo: disciplinas.codigo,
        disciplinaNome: disciplinas.nome,
        disciplinaCreditos: disciplinas.creditos,
        disciplinaCargaHoraria: disciplinas.cargaHoraria,
        disciplinaPeriodoId: disciplinas.periodoId,
        disciplinaCursoId: disciplinas.cursoId,
        periodoId: periodos.id,
        periodoNumero: periodos.numero,
        periodoNome: periodos.nome,
        professorMatricula: professores.matricula,
        professorPessoaId: professores.pessoaId,
        professorFormacaoAcad: professores.formacaoAcad,
        professorSituacao: professores.situacao,
        professorPessoaIdPk: pessoas.id,
        professorNomeCompleto: pessoas.nomeCompleto,
        professorEmail: pessoas.email,
        professorTelefone: pessoas.telefone,
        coortePk: coortes.id,
        coorteRotulo: coortes.rotulo,
        coorteAnoIngresso: coortes.anoIngresso,
        coorteAtivo: coortes.ativo,
        totalInscritos: sql<number>`COUNT(${turmasInscritos.id})`,
      })
      .from(turmas)
      .leftJoin(disciplinas, eq(disciplinas.id, turmas.disciplinaId))
      .leftJoin(periodos, eq(periodos.id, disciplinas.periodoId))
      .leftJoin(professores, eq(professores.matricula, turmas.professorId))
      .leftJoin(pessoas, eq(pessoas.id, professores.pessoaId))
      .leftJoin(coortes, eq(coortes.id, turmas.coorteId))
      .leftJoin(turmasInscritos, eq(turmasInscritos.turmaId, turmas.id))
      .groupBy(
        turmas.id,
        disciplinas.id,
        periodos.id,
        professores.matricula,
        pessoas.id,
        coortes.id,
      )
      .orderBy(desc(turmas.id));

    const data = turmasRows.map((row) => {
      const disciplina = row.disciplinaPk
        ? {
            id: row.disciplinaPk,
            codigo: row.disciplinaCodigo,
            nome: row.disciplinaNome,
            creditos:
              row.disciplinaCreditos !== null && row.disciplinaCreditos !== undefined
                ? Number(row.disciplinaCreditos)
                : null,
            cargaHoraria:
              row.disciplinaCargaHoraria !== null && row.disciplinaCargaHoraria !== undefined
                ? Number(row.disciplinaCargaHoraria)
                : null,
            periodoId: row.disciplinaPeriodoId ?? null,
            cursoId: row.disciplinaCursoId ?? null,
            periodo:
              row.periodoId !== null && row.periodoId !== undefined
                ? {
                    id: row.periodoId,
                    numero:
                      row.periodoNumero !== null && row.periodoNumero !== undefined
                        ? Number(row.periodoNumero)
                        : null,
                    nome: row.periodoNome ?? null,
                  }
                : null,
          }
        : null;

      const professor = row.professorMatricula
        ? {
            matricula: row.professorMatricula,
            pessoaId: row.professorPessoaId ?? null,
            formacaoAcad: row.professorFormacaoAcad ?? null,
            situacao: row.professorSituacao ?? null,
            pessoa:
              row.professorPessoaIdPk !== null && row.professorPessoaIdPk !== undefined
                ? {
                    id: row.professorPessoaIdPk,
                    nomeCompleto: row.professorNomeCompleto ?? null,
                    email: row.professorEmail ?? null,
                    telefone: row.professorTelefone ?? null,
                  }
                : null,
          }
        : null;

      const coorte = row.coortePk
        ? {
            id: row.coortePk,
            rotulo: row.coorteRotulo ?? '',
            anoIngresso: row.coorteAnoIngresso ?? null,
            ativo: row.coorteAtivo ?? false,
          }
        : null;

      return {
        id: row.turmaId,
        disciplinaId: row.disciplinaId,
        professorId: row.professorId,
        coorteId: row.coorteId,
        sala: row.sala,
        horario: row.horario,
        secao: row.secao,
        totalInscritos: Number(row.totalInscritos ?? 0),
        disciplina,
        professor,
        coorte,
      };
    });

    res.json({
      success: true,
      data,
      message: `Found ${data.length} records`,
    });
  }),
);

// GET /turmas/:id - Get turma by ID (any authenticated user can view)
router.get(
  '/:id',
  validateParams(IdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = IdParamSchema.parse(req.params);

    const [turmaRow] = await db
      .select({
        turmaId: turmas.id,
        disciplinaId: turmas.disciplinaId,
        professorId: turmas.professorId,
        coorteId: turmas.coorteId,
        sala: turmas.sala,
        horario: turmas.horario,
        secao: turmas.secao,
        disciplinaPk: disciplinas.id,
        disciplinaCodigo: disciplinas.codigo,
        disciplinaNome: disciplinas.nome,
        disciplinaCreditos: disciplinas.creditos,
        disciplinaCargaHoraria: disciplinas.cargaHoraria,
        disciplinaCursoId: disciplinas.cursoId,
        disciplinaPeriodoId: disciplinas.periodoId,
        disciplinaEmenta: disciplinas.ementa,
        disciplinaBibliografia: disciplinas.bibliografia,
        periodoId: periodos.id,
        periodoNumero: periodos.numero,
        periodoNome: periodos.nome,
        professorMatricula: professores.matricula,
        professorPessoaId: professores.pessoaId,
        professorFormacaoAcad: professores.formacaoAcad,
        professorSituacao: professores.situacao,
        professorPessoaPk: pessoas.id,
        professorNomeCompleto: pessoas.nomeCompleto,
        professorEmail: pessoas.email,
        professorTelefone: pessoas.telefone,
        coortePk: coortes.id,
        coorteRotulo: coortes.rotulo,
        coorteAnoIngresso: coortes.anoIngresso,
        coorteAtivo: coortes.ativo,
        totalInscritos: sql<number>`COUNT(${turmasInscritos.id})`,
      })
      .from(turmas)
      .leftJoin(disciplinas, eq(disciplinas.id, turmas.disciplinaId))
      .leftJoin(periodos, eq(periodos.id, disciplinas.periodoId))
      .leftJoin(professores, eq(professores.matricula, turmas.professorId))
      .leftJoin(pessoas, eq(pessoas.id, professores.pessoaId))
      .leftJoin(coortes, eq(coortes.id, turmas.coorteId))
      .leftJoin(turmasInscritos, eq(turmasInscritos.turmaId, turmas.id))
      .where(eq(turmas.id, id))
      .groupBy(
        turmas.id,
        disciplinas.id,
        periodos.id,
        professores.matricula,
        pessoas.id,
        coortes.id,
      );

    if (!turmaRow) {
      return res.status(404).json({ success: false, message: 'Turma não encontrada' });
    }

    const inscritosRows = await db
      .select({
        id: turmasInscritos.id,
        turmaId: turmasInscritos.turmaId,
        alunoId: turmasInscritos.alunoId,
        media: turmasInscritos.media,
        frequencia: turmasInscritos.frequencia,
        status: turmasInscritos.status,
        alunoRa: alunos.ra,
        alunoPessoaId: alunos.pessoaId,
        alunoPessoaPk: alunoPessoa.id,
        alunoNomeCompleto: alunoPessoa.nomeCompleto,
        alunoEmail: alunoPessoa.email,
        alunoTelefone: alunoPessoa.telefone,
      })
      .from(turmasInscritos)
      .leftJoin(alunos, eq(alunos.ra, turmasInscritos.alunoId))
      .leftJoin(alunoPessoa, eq(alunoPessoa.id, alunos.pessoaId))
      .where(eq(turmasInscritos.turmaId, id));

    const inscritos = inscritosRows.map((row) => ({
      id: row.id,
      turmaId: row.turmaId,
      alunoId: row.alunoId,
      media: row.media !== null && row.media !== undefined ? Number(row.media) : null,
      frequencia: row.frequencia !== null && row.frequencia !== undefined ? Number(row.frequencia) : null,
      status: row.status,
      aluno:
        row.alunoRa !== null && row.alunoRa !== undefined
          ? {
              ra: row.alunoRa,
              pessoaId: row.alunoPessoaId ?? null,
              pessoa:
                row.alunoPessoaPk !== null && row.alunoPessoaPk !== undefined
                  ? {
                      id: row.alunoPessoaPk,
                      nomeCompleto: row.alunoNomeCompleto ?? null,
                      email: row.alunoEmail ?? null,
                      telefone: row.alunoTelefone ?? null,
                    }
                  : null,
            }
          : null,
    }));

    const turmaDetalhe = {
      id: turmaRow.turmaId,
      disciplinaId: turmaRow.disciplinaId,
      professorId: turmaRow.professorId,
      coorteId: turmaRow.coorteId,
      sala: turmaRow.sala,
      horario: turmaRow.horario,
      secao: turmaRow.secao,
      totalInscritos: Number(turmaRow.totalInscritos ?? 0),
      disciplina: turmaRow.disciplinaPk
        ? {
            id: turmaRow.disciplinaPk,
            codigo: turmaRow.disciplinaCodigo,
            nome: turmaRow.disciplinaNome,
            creditos:
              turmaRow.disciplinaCreditos !== null && turmaRow.disciplinaCreditos !== undefined
                ? Number(turmaRow.disciplinaCreditos)
                : null,
            cargaHoraria:
              turmaRow.disciplinaCargaHoraria !== null && turmaRow.disciplinaCargaHoraria !== undefined
                ? Number(turmaRow.disciplinaCargaHoraria)
                : null,
            cursoId: turmaRow.disciplinaCursoId ?? null,
            periodoId: turmaRow.disciplinaPeriodoId ?? null,
            ementa: turmaRow.disciplinaEmenta ?? null,
            bibliografia: turmaRow.disciplinaBibliografia ?? null,
            periodo:
              turmaRow.periodoId !== null && turmaRow.periodoId !== undefined
                ? {
                    id: turmaRow.periodoId,
                    numero:
                      turmaRow.periodoNumero !== null && turmaRow.periodoNumero !== undefined
                        ? Number(turmaRow.periodoNumero)
                        : null,
                    nome: turmaRow.periodoNome ?? null,
                  }
                : null,
          }
        : null,
      professor: turmaRow.professorMatricula
        ? {
            matricula: turmaRow.professorMatricula,
            pessoaId: turmaRow.professorPessoaId ?? null,
            formacaoAcad: turmaRow.professorFormacaoAcad ?? null,
            situacao: turmaRow.professorSituacao ?? null,
            pessoa:
              turmaRow.professorPessoaPk !== null && turmaRow.professorPessoaPk !== undefined
                ? {
                    id: turmaRow.professorPessoaPk,
                    nomeCompleto: turmaRow.professorNomeCompleto ?? null,
                    email: turmaRow.professorEmail ?? null,
                    telefone: turmaRow.professorTelefone ?? null,
                  }
                : null,
          }
        : null,
      coorte: turmaRow.coortePk
        ? {
            id: turmaRow.coortePk,
            rotulo: turmaRow.coorteRotulo ?? '',
            anoIngresso: turmaRow.coorteAnoIngresso ?? null,
            ativo: turmaRow.coorteAtivo ?? false,
          }
        : null,
    };

    res.json({
      success: true,
      data: { ...turmaDetalhe, inscritos },
    });
  }),
);

router.get(
  '/:id/inscritos',
  validateParams(IdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = IdParamSchema.parse(req.params);

    const exists = await db.select({ id: turmas.id }).from(turmas).where(eq(turmas.id, id)).limit(1);
    if (exists.length === 0) {
      return res.status(404).json({ success: false, message: 'Turma não encontrada' });
    }

    const inscritosRows = await db
      .select({
        id: turmasInscritos.id,
        turmaId: turmasInscritos.turmaId,
        alunoId: turmasInscritos.alunoId,
        media: turmasInscritos.media,
        frequencia: turmasInscritos.frequencia,
        status: turmasInscritos.status,
        alunoRa: alunos.ra,
        alunoPessoaId: alunos.pessoaId,
        alunoPessoaPk: alunoPessoa.id,
        alunoNomeCompleto: alunoPessoa.nomeCompleto,
        alunoEmail: alunoPessoa.email,
        alunoTelefone: alunoPessoa.telefone,
      })
      .from(turmasInscritos)
      .leftJoin(alunos, eq(alunos.ra, turmasInscritos.alunoId))
      .leftJoin(alunoPessoa, eq(alunoPessoa.id, alunos.pessoaId))
      .where(eq(turmasInscritos.turmaId, id));

    const data = inscritosRows.map((row) => ({
      id: row.id,
      turmaId: row.turmaId,
      alunoId: row.alunoId,
      media: row.media !== null && row.media !== undefined ? Number(row.media) : null,
      frequencia: row.frequencia !== null && row.frequencia !== undefined ? Number(row.frequencia) : null,
      status: row.status,
      aluno:
        row.alunoRa !== null && row.alunoRa !== undefined
          ? {
              ra: row.alunoRa,
              pessoaId: row.alunoPessoaId ?? null,
              pessoa:
                row.alunoPessoaPk !== null && row.alunoPessoaPk !== undefined
                  ? {
                      id: row.alunoPessoaPk,
                      nomeCompleto: row.alunoNomeCompleto ?? null,
                      email: row.alunoEmail ?? null,
                      telefone: row.alunoTelefone ?? null,
                    }
                  : null,
            }
          : null,
    }));

    res.json({ success: true, data });
  }),
);

router.post(
  '/:id/inscritos',
  validateParams(IdParamSchema),
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = IdParamSchema.parse(req.params);
    const payload = CreateTurmaInscricaoSchema.parse(req.body);

    const turmaExists = await db.select({ id: turmas.id }).from(turmas).where(eq(turmas.id, id)).limit(1);
    if (turmaExists.length === 0) {
      return res.status(404).json({ success: false, message: 'Turma não encontrada' });
    }

    const alunoExists = await db.select({ ra: alunos.ra }).from(alunos).where(eq(alunos.ra, payload.alunoId)).limit(1);
    if (alunoExists.length === 0) {
      return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
    }

    const already = await db
      .select({ id: turmasInscritos.id })
      .from(turmasInscritos)
      .where(and(eq(turmasInscritos.turmaId, id), eq(turmasInscritos.alunoId, payload.alunoId)))
      .limit(1);
    if (already.length > 0) {
      return res.status(409).json({ success: false, message: 'Aluno já inscrito na turma' });
    }

    const [created] = await db
      .insert(turmasInscritos)
      .values({
        turmaId: id,
        alunoId: payload.alunoId,
        status: payload.status ?? 'MATRICULADO',
      })
      .returning();

    const [joined] = await db
      .select({
        id: turmasInscritos.id,
        turmaId: turmasInscritos.turmaId,
        alunoId: turmasInscritos.alunoId,
        media: turmasInscritos.media,
        frequencia: turmasInscritos.frequencia,
        status: turmasInscritos.status,
        alunoRa: alunos.ra,
        alunoPessoaId: alunos.pessoaId,
        alunoPessoaPk: alunoPessoa.id,
        alunoNomeCompleto: alunoPessoa.nomeCompleto,
        alunoEmail: alunoPessoa.email,
        alunoTelefone: alunoPessoa.telefone,
      })
      .from(turmasInscritos)
      .leftJoin(alunos, eq(alunos.ra, turmasInscritos.alunoId))
      .leftJoin(alunoPessoa, eq(alunoPessoa.id, alunos.pessoaId))
      .where(eq(turmasInscritos.id, created.id));

    const data = joined
      ? {
          id: joined.id,
          turmaId: joined.turmaId,
          alunoId: joined.alunoId,
          media: joined.media !== null && joined.media !== undefined ? Number(joined.media) : null,
          frequencia: joined.frequencia !== null && joined.frequencia !== undefined ? Number(joined.frequencia) : null,
          status: joined.status,
          aluno:
            joined.alunoRa !== null && joined.alunoRa !== undefined
              ? {
                  ra: joined.alunoRa,
                  pessoaId: joined.alunoPessoaId ?? null,
                  pessoa:
                    joined.alunoPessoaPk !== null && joined.alunoPessoaPk !== undefined
                      ? {
                          id: joined.alunoPessoaPk,
                          nomeCompleto: joined.alunoNomeCompleto ?? null,
                          email: joined.alunoEmail ?? null,
                          telefone: joined.alunoTelefone ?? null,
                        }
                      : null,
                }
              : null,
        }
      : null;

    res.status(201).json({ success: true, message: 'Aluno inscrito com sucesso', data });
  }),
);

router.post(
  '/:id/inscritos/bulk',
  validateParams(IdParamSchema),
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = IdParamSchema.parse(req.params);
    const payload = BulkTurmaInscricaoSchema.parse(req.body);

    const turmaExists = await db.select({ id: turmas.id }).from(turmas).where(eq(turmas.id, id)).limit(1);
    if (turmaExists.length === 0) {
      return res.status(404).json({ success: false, message: 'Turma não encontrada' });
    }

    let alunoIds: string[] = [];
    if (payload.alunoIds && payload.alunoIds.length > 0) {
      alunoIds = payload.alunoIds;
    }

    if (payload.coorteId) {
      const alunosDaCoorte = await db
        .select({ ra: alunos.ra })
        .from(alunos)
        .where(eq(alunos.coorteId, payload.coorteId));
      alunoIds = [...new Set([...alunoIds, ...alunosDaCoorte.map((a) => a.ra)])];
    }

    if (alunoIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhum aluno válido encontrado para inscrição' });
    }

    const existing = await db
      .select({ alunoId: turmasInscritos.alunoId })
      .from(turmasInscritos)
      .where(and(eq(turmasInscritos.turmaId, id), inArray(turmasInscritos.alunoId, alunoIds)));

    const existingSet = new Set(existing.map((item) => item.alunoId));
    const novosAlunos = alunoIds.filter((alunoId) => !existingSet.has(alunoId));

    if (novosAlunos.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum aluno novo para inscrever',
        data: { adicionados: 0, ignorados: alunoIds.length },
      });
    }

    const insertValues = novosAlunos.map((alunoId) => ({
      turmaId: id,
      alunoId,
      status: payload.status ?? 'MATRICULADO',
    }));

    await db.insert(turmasInscritos).values(insertValues);

    res.status(201).json({
      success: true,
      message: 'Inscrições realizadas com sucesso',
      data: { adicionados: insertValues.length, ignorados: alunoIds.length - novosAlunos.length },
    });
  }),
);

router.patch(
  '/:id/inscritos/:inscricaoId',
  validateParams(TurmaInscricaoParamsSchema),
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, inscricaoId } = TurmaInscricaoParamsSchema.parse(req.params);
    const body = UpdateTurmaInscricaoSchema.parse(req.body);

    const [exists] = await db
      .select()
      .from(turmasInscritos)
      .where(and(eq(turmasInscritos.id, inscricaoId), eq(turmasInscritos.turmaId, id)))
      .limit(1);

    if (!exists) {
      return res.status(404).json({ success: false, message: 'Inscrição não encontrada' });
    }

    const [updated] = await db
      .update(turmasInscritos)
      .set({ status: body.status ?? exists.status })
      .where(eq(turmasInscritos.id, inscricaoId))
      .returning();

    res.json({ success: true, message: 'Inscrição atualizada com sucesso', data: updated });
  }),
);

router.delete(
  '/:id/inscritos/:inscricaoId',
  validateParams(TurmaInscricaoParamsSchema),
  requireProfessor,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, inscricaoId } = TurmaInscricaoParamsSchema.parse(req.params);

    const deleted = await db
      .delete(turmasInscritos)
      .where(and(eq(turmasInscritos.id, inscricaoId), eq(turmasInscritos.turmaId, id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ success: false, message: 'Inscrição não encontrada' });
    }

    res.json({ success: true, message: 'Inscrição removida com sucesso' });
  }),
);

// POST /turmas - Create new turma (requires ADMIN, SECRETARIA or PROFESSOR)
router.post('/', requireSecretaria, turmasCrud.create);

// PATCH /turmas/:id - Update turma (requires ADMIN, SECRETARIA or PROFESSOR)
router.patch('/:id', validateParams(IdParamSchema), requireSecretaria, turmasCrud.update);

// DELETE /turmas/:id - Delete turma (requires ADMIN, SECRETARIA or PROFESSOR)
router.delete('/:id', validateParams(IdParamSchema), requireSecretaria, turmasCrud.delete);

export default router; 