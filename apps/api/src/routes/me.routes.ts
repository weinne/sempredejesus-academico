import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { db } from '../db';
import { pessoas, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { validateBody } from '../middleware/validation.middleware';
import { ChangePasswordSchema, UpdatePessoaSchema } from '@seminario/shared-dtos';
import bcrypt from 'bcrypt';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /me - Get current authenticated user with pessoa data
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const authUser = req.user as any;
  const userId = parseInt(authUser.id);

  const result = await db
    .select({
      id: users.id,
      pessoaId: users.pessoaId,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      pessoa: {
        id: pessoas.id,
        nomeCompleto: pessoas.nomeCompleto,
        email: pessoas.email,
        cpf: pessoas.cpf,
        telefone: pessoas.telefone,
      },
    })
    .from(users)
    .innerJoin(pessoas, eq(users.pessoaId, pessoas.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    throw createError('User not found', 404);
  }

  res.json({ success: true, data: result[0] });
}));

// PATCH /me/profile - Update current user's pessoa profile
router.patch('/profile', validateBody(UpdatePessoaSchema), asyncHandler(async (req: Request, res: Response) => {
  const authUser = req.user as any;
  const pessoaId = parseInt(authUser.pessoaId);

  const [updated] = await db
    .update(pessoas)
    .set(req.body)
    .where(eq(pessoas.id, pessoaId))
    .returning();

  if (!updated) {
    throw createError('Profile not found', 404);
  }

  res.json({ success: true, message: 'Profile updated successfully', data: updated });
}));

// PATCH /me/change-password - Change current user's password
router.patch('/change-password', validateBody(ChangePasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const authUser = req.user as any;
  const userId = parseInt(authUser.id);
  const { currentPassword, newPassword } = req.body;

  const existing = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    throw createError('User not found', 404);
  }

  if (!currentPassword) {
    throw createError('Current password is required', 400);
  }

  const isValid = await bcrypt.compare(currentPassword, (existing[0] as any).passwordHash);
  if (!isValid) {
    throw createError('Current password is incorrect', 400);
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, userId));

  res.json({ success: true, message: 'Password updated successfully' });
}));

export default router;


