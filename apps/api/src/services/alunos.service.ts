import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { CreateAlunoWithUser } from '@seminario/shared-dtos';
import { db } from '../db';
import { alunos, pessoas, cursos, periodos, curriculos, turnos, coortes, users, userRoles } from '../db/schema';
import { createError } from '../middleware/error.middleware';

export interface CreateAlunoResult {
  aluno: typeof alunos.$inferSelect;
  user: { id: number; username: string } | null;
}

export const assertPeriodoBelongsToCurso = async (cursoId: number, periodoId: number | null | undefined) => {
  if (!periodoId) {
    return;
  }

  const periodo = await db
    .select({
      id: periodos.id,
      curriculoId: periodos.curriculoId,
      cursoId: curriculos.cursoId,
    })
    .from(periodos)
    .leftJoin(curriculos, eq(curriculos.id, periodos.curriculoId))
    .where(eq(periodos.id, periodoId))
    .limit(1);

  if (periodo.length === 0 || !periodo[0].cursoId) {
    throw createError('Período informado não existe', 404);
  }

  if (periodo[0].cursoId !== cursoId) {
    throw createError('O período selecionado não pertence ao curso informado', 400);
  }
};

export const generateUniqueRA = async (anoIngresso: number): Promise<string> => {
  const year = anoIngresso.toString();
  let sequencial = 1;
  let ra: string;

  do {
    ra = `${year}${sequencial.toString().padStart(3, '0')}`;
    const existing = await db.select().from(alunos).where(eq(alunos.ra, ra)).limit(1);
    if (existing.length === 0) break;
    sequencial++;
  } while (sequencial <= 999);

  if (sequencial > 999) {
    throw createError('Não foi possível gerar RA único para o ano', 400);
  }

  return ra;
};

export const createAlunoWithUserRecord = async (payload: CreateAlunoWithUser): Promise<CreateAlunoResult> => {
  const { createUser, username, password, ...alunoData } = payload as CreateAlunoWithUser & {
    createUser?: boolean;
    username?: string;
    password?: string;
  };

  if (alunoData.ra) {
    const existingAluno = await db.select().from(alunos).where(eq(alunos.ra, alunoData.ra)).limit(1);
    if (existingAluno.length > 0) {
      throw createError(`RA ${alunoData.ra} já está em uso`, 400);
    }
  }

  const ra = alunoData.ra || (await generateUniqueRA(alunoData.anoIngresso));

  await assertPeriodoBelongsToCurso(alunoData.cursoId, alunoData.periodoId);

  const alunoDataForDB: any = {
    ...alunoData,
    ra,
    coeficienteAcad: alunoData.coeficienteAcad?.toString(),
  };

  const result = await db.transaction(async (tx) => {
    let finalPessoaId = alunoDataForDB.pessoaId;
    if (!finalPessoaId && alunoDataForDB.pessoa) {
      const pessoaPayload = alunoDataForDB.pessoa;
      const [novaPessoa] = await tx
        .insert(pessoas)
        .values({
          nomeCompleto: pessoaPayload.nomeCompleto,
          sexo: pessoaPayload.sexo,
          email: pessoaPayload.email,
          cpf: pessoaPayload.cpf,
          dataNasc: pessoaPayload.dataNasc,
          telefone: pessoaPayload.telefone,
          endereco: pessoaPayload.endereco,
        })
        .returning();
      finalPessoaId = novaPessoa.id;
    }

    if (!finalPessoaId) {
      throw createError('pessoaId é obrigatório (ou forneça pessoa inline)', 400);
    }

    const existingUserForPessoa = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.pessoaId, finalPessoaId))
      .limit(1);
    if (existingUserForPessoa.length > 0) {
      await tx
        .insert(userRoles)
        .values({ userId: existingUserForPessoa[0].id, role: 'ALUNO' })
        .onConflictDoNothing();
    }

    const insertValues = { ...alunoDataForDB, pessoaId: finalPessoaId } as typeof alunoDataForDB;
    delete insertValues.pessoa;

    const [novoAluno] = await tx
      .insert(alunos)
      .values(insertValues)
      .returning();

    let novoUser: { id: number; username: string } | null = null;
    if (createUser && username && password) {
      const existingUser = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.pessoaId, finalPessoaId))
        .limit(1);

      const passwordHash = await bcrypt.hash(password, 12);

      if (existingUser.length > 0) {
        const userId = existingUser[0].id;
        await tx
          .insert(userRoles)
          .values({ userId, role: 'ALUNO' })
          .onConflictDoNothing();
        const [userRow] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
        if (userRow) {
          novoUser = { id: userRow.id, username: userRow.username };
        }
      } else {
        const [createdUser] = await tx
          .insert(users)
          .values({
            pessoaId: finalPessoaId,
            username,
            passwordHash,
            role: 'ALUNO',
            isActive: 'S',
          })
          .returning();
        novoUser = createdUser ? { id: createdUser.id, username: createdUser.username } : null;
        if (createdUser) {
          await tx
            .insert(userRoles)
            .values({ userId: createdUser.id, role: 'ALUNO' })
            .onConflictDoNothing();
        }
      }
    }

    return { aluno: novoAluno, user: novoUser } satisfies CreateAlunoResult;
  });

  return result;
};

export const getAlunoCompleteByRa = async (ra: string) => {
  const result = await db
    .select()
    .from(alunos)
    .leftJoin(pessoas, eq(alunos.pessoaId, pessoas.id))
    .leftJoin(cursos, eq(alunos.cursoId, cursos.id))
    .leftJoin(periodos, eq(alunos.periodoId, periodos.id))
    .leftJoin(turnos, eq(alunos.turnoId, turnos.id))
    .leftJoin(coortes, eq(alunos.coorteId, coortes.id))
    .where(eq(alunos.ra, ra))
    .limit(1);

  if (result.length === 0) {
    throw createError('Aluno not found', 404);
  }

  const row = result[0];

  return {
    ra: row.alunos.ra,
    pessoaId: row.alunos.pessoaId,
    cursoId: row.alunos.cursoId,
    turnoId: row.alunos.turnoId,
    coorteId: row.alunos.coorteId,
    periodoId: row.alunos.periodoId,
    anoIngresso: row.alunos.anoIngresso,
    igreja: row.alunos.igreja,
    situacao: row.alunos.situacao,
    coeficienteAcad: row.alunos.coeficienteAcad,
    createdAt: row.alunos.createdAt,
    updatedAt: row.alunos.updatedAt,
    pessoa: row.pessoas
      ? {
          id: row.pessoas.id,
          nome: row.pessoas.nomeCompleto,
          sexo: row.pessoas.sexo,
          email: row.pessoas.email,
          cpf: row.pessoas.cpf,
          data_nascimento: row.pessoas.dataNasc,
          telefone: row.pessoas.telefone,
          endereco: row.pessoas.endereco,
        }
      : null,
    curso: row.cursos
      ? {
          id: row.cursos.id,
          nome: row.cursos.nome,
          grau: row.cursos.grau,
        }
      : null,
    turno: row.turnos
      ? {
          id: row.turnos.id,
          nome: row.turnos.nome,
        }
      : null,
    coorte: row.coortes
      ? {
          id: row.coortes.id,
          rotulo: row.coortes.rotulo,
          anoIngresso: row.coortes.anoIngresso,
        }
      : null,
    periodo: row.periodos
      ? {
          id: row.periodos.id,
          curriculoId: row.periodos.curriculoId,
          numero: row.periodos.numero,
          nome: row.periodos.nome,
          descricao: row.periodos.descricao,
        }
      : null,
  };
};
