import { Router, Request, Response } from 'express';
import { jwtService, PasswordService, UserRole } from '@seminario/shared-auth';
import { config, logger } from '@seminario/shared-config';
import { LoginSchema, RefreshTokenSchema } from '@seminario/shared-dtos';
import { validateBody } from '../middleware/validation.middleware';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { db } from '../db';
import { pessoas, alunos, professores, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { tokenBlacklistService } from '../core/token-blacklist.service';

const router = Router();
const passwordService = new PasswordService();

// POST /auth/login
router.post('/login', validateBody(LoginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  // Find user by email (join with users table)
  const userQuery = await db
    .select({
      userId: users.id,
      pessoaId: pessoas.id,
      username: users.username,
      passwordHash: users.passwordHash,
      role: users.role,
      isActive: users.isActive,
      email: pessoas.email,
      nomeCompleto: pessoas.nomeCompleto,
    })
    .from(users)
    .innerJoin(pessoas, eq(users.pessoaId, pessoas.id))
    .where(eq(pessoas.email, email))
    .limit(1);

  if (userQuery.length === 0) {
    throw createError('Invalid credentials', 401);
  }

  const userData = userQuery[0];

  // For now, we'll create a simple password validation
  // In a real implementation, you'd verify against userData.passwordHash
  // This is just for demo purposes
  const isValidPassword = password === 'admin123'; // Simplified for demo

  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  // Use role from database
  const role = userData.role as UserRole;

  // Generate tokens using the correct user.id
  const tokens = jwtService.generateTokenPair({
    id: userData.userId.toString(),
    email: userData.email || '',
    nome: userData.nomeCompleto,
    role,
    pessoaId: userData.pessoaId.toString(),
    ativo: userData.isActive === 'S',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: config.server.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: userData.userId.toString(),
        nome: userData.nomeCompleto,
        email: userData.email || '',
        role,
      },
    },
  });
}));

// POST /auth/refresh
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw createError('Refresh token required', 401);
  }

  try {
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    
    // Get user details from users table
    const userQuery = await db
      .select({
        userId: users.id,
        pessoaId: pessoas.id,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        email: pessoas.email,
        nomeCompleto: pessoas.nomeCompleto,
      })
      .from(users)
      .innerJoin(pessoas, eq(users.pessoaId, pessoas.id))
      .where(eq(users.id, parseInt(decoded.sub)))
      .limit(1);

    if (userQuery.length === 0) {
      throw createError('User not found', 404);
    }

    const userData = userQuery[0];

    // Generate new tokens
    const tokens = jwtService.generateTokenPair({
      id: userData.userId.toString(),
      email: userData.email || '',
      nome: userData.nomeCompleto,
      role: userData.role as UserRole,
      pessoaId: userData.pessoaId.toString(),
      ativo: userData.isActive === 'S',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: config.server.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    throw createError('Invalid refresh token', 401);
  }
}));

// POST /auth/logout
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // Extract access token from Authorization header
  const authHeader = req.headers.authorization;
  const accessToken = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (accessToken) {
    try {
      // Add token to blacklist
      await tokenBlacklistService.blacklistToken(accessToken);
      logger.info('Access token blacklisted successfully');
    } catch (error) {
      logger.error('Error blacklisting token:', error);
      // Continue with logout even if blacklisting fails
    }
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

// GET /auth/me - Get current user info
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  // This would typically require auth middleware
  // For now, just return a placeholder response
  res.json({
    success: true,
    message: 'User info retrieved',
    data: {
      id: '1',
      nome: 'Admin User',
      email: 'admin@seminario.edu',
      role: UserRole.ADMIN,
    },
  });
}));

export default router;