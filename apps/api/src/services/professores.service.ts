import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { CreateProfessorWithUser } from '@seminario/shared-dtos';
import { db } from '../db';
import { professores, pessoas, users, userRoles } from '../db/schema';
import { createError } from '../middleware/error.middleware';

export interface CreateProfessorResult {
  professor: typeof professores.$inferSelect;
  user: { id: number; username: string } | null;
}

export const createProfessorWithUserRecord = async (
  payload: CreateProfessorWithUser,
): Promise<CreateProfessorResult> => {
  const { createUser, username, password, pessoa: pessoaPayload, ...professorData } = payload;

  const existingProfessor = await db
    .select({ matricula: professores.matricula })
    .from(professores)
    .where(eq(professores.matricula, professorData.matricula))
    .limit(1);

  if (existingProfessor.length > 0) {
    throw createError(`Matrícula ${professorData.matricula} já está em uso`, 400);
  }

  const result = await db.transaction(async (tx) => {
    let finalPessoaId = professorData.pessoaId;

    if (!finalPessoaId && pessoaPayload) {
      const sexoValue = (pessoaPayload.sexo ?? 'O').toString().toUpperCase().slice(0, 1);
      const [novaPessoa] = await tx
        .insert(pessoas)
        .values({
          nomeCompleto: pessoaPayload.nomeCompleto,
          sexo: sexoValue,
          email: pessoaPayload.email ?? null,
          cpf: pessoaPayload.cpf ?? null,
          dataNasc: pessoaPayload.dataNasc ?? null,
          telefone: pessoaPayload.telefone ?? null,
          endereco: (pessoaPayload.endereco as any) ?? null,
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
        .values({ userId: existingUserForPessoa[0].id, role: 'PROFESSOR' })
        .onConflictDoNothing();
    }

    const [novoProfessor] = await tx
      .insert(professores)
      .values({
        ...professorData,
        pessoaId: finalPessoaId,
      })
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
          .values({ userId, role: 'PROFESSOR' })
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
            role: 'PROFESSOR',
            isActive: 'S',
          })
          .returning();

        if (createdUser) {
          novoUser = { id: createdUser.id, username: createdUser.username };
          await tx
            .insert(userRoles)
            .values({ userId: createdUser.id, role: 'PROFESSOR' })
            .onConflictDoNothing();
        }
      }
    }

    return { professor: novoProfessor, user: novoUser } satisfies CreateProfessorResult;
  });

  return result;
};
