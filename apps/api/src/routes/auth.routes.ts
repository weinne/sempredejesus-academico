import { Router, Request, Response } from 'express';
import { jwtService, PasswordService, UserRole } from '@seminario/shared-auth';
import { config, logger } from '@seminario/shared-config';
import { LoginSchema, RefreshTokenSchema } from '@seminario/shared-dtos';
import { validateBody } from '../middleware/validation.middleware';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { db } from '../db';
import { pessoas, alunos, professores } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const passwordService = new PasswordService();

// POST /auth/login
router.post('/login', validateBody(LoginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  // Find user by email
  const pessoa = await db
    .select()
    .from(pessoas)
    .where(eq(pessoas.email, email))
    .limit(1);

  if (pessoa.length === 0) {
    throw createError('Invalid credentials', 401);
  }

  // For now, we'll create a simple password validation
  // In a real implementation, you'd have a users table with hashed passwords
  // This is just for demo purposes
  const isValidPassword = password === 'admin123'; // Simplified for demo

  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  // Determine user role based on related tables
  let role: UserRole = UserRole.ALUNO;
  
  // Check if user is a professor
  const professor = await db
    .select()
    .from(professores)
    .where(eq(professores.pessoaId, pessoa[0].id))
    .limit(1);

  if (professor.length > 0) {
    role = UserRole.PROFESSOR;
  } else {
    // Check if user is a student
    const aluno = await db
      .select()
      .from(alunos)
      .where(eq(alunos.pessoaId, pessoa[0].id))
      .limit(1);

    if (aluno.length > 0) {
      role = UserRole.ALUNO;
    }
  }

  // For demo purposes, if email is admin@seminario.edu, make them admin
  if (email === 'admin@seminario.edu') {
    role = UserRole.ADMIN;
  }

  // Generate tokens
  const tokens = jwtService.generateTokenPair({
    id: pessoa[0].id.toString(),
    email: pessoa[0].email || '',
    nome: pessoa[0].nomeCompleto,
    role,
    pessoaId: pessoa[0].id.toString(),
    ativo: true,
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
        id: pessoa[0].id.toString(),
        nome: pessoa[0].nomeCompleto,
        email: pessoa[0].email || '',
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
    
    // Get user details
    const pessoa = await db
      .select()
      .from(pessoas)
      .where(eq(pessoas.id, parseInt(decoded.sub)))
      .limit(1);

    if (pessoa.length === 0) {
      throw createError('User not found', 404);
    }

    // Determine role (simplified for demo)
    let role: UserRole = UserRole.ALUNO;
    
    if (pessoa[0].email === 'admin@seminario.edu') {
      role = UserRole.ADMIN;
    }

    // Generate new tokens
    const tokens = jwtService.generateTokenPair({
      id: decoded.sub,
      email: pessoa[0].email || '',
      nome: pessoa[0].nomeCompleto,
      role,
      pessoaId: pessoa[0].id.toString(),
      ativo: true,
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