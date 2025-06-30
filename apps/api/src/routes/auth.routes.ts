import { Router } from 'express';
import { JwtService, PasswordService } from '@seminario/shared-auth';
import { config, logger } from '@seminario/shared-config';
import { LoginSchema, RefreshTokenSchema } from '@seminario/shared-dtos';
import { validateBody } from '../middleware/validation.middleware';
import { asyncHandler, createError } from '../middleware/error.middleware';
import { db } from '../db';
import { pessoas, alunos, professores } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const jwtService = new JwtService(config.jwt.secret, config.jwt.refreshSecret, config.jwt.expiresIn);
const passwordService = new PasswordService();

// POST /auth/login
router.post('/login', validateBody(LoginSchema), asyncHandler(async (req, res) => {
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
  let role: 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'ALUNO' = 'ALUNO';
  
  // Check if user is a professor
  const professor = await db
    .select()
    .from(professores)
    .where(eq(professores.pessoaId, pessoa[0].id))
    .limit(1);

  if (professor.length > 0) {
    role = 'PROFESSOR';
  } else {
    // Check if user is a student
    const aluno = await db
      .select()
      .from(alunos)
      .where(eq(alunos.pessoaId, pessoa[0].id))
      .limit(1);

    if (aluno.length > 0) {
      role = 'ALUNO';
    }
  }

  // For demo purposes, if email is admin@seminario.edu, make them admin
  if (email === 'admin@seminario.edu') {
    role = 'ADMIN';
  }

  // Generate tokens
  const tokens = jwtService.generateTokenPair({
    sub: pessoa[0].id.toString(),
    role,
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
router.post('/refresh', asyncHandler(async (req, res) => {
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
    let role: 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'ALUNO' = 'ALUNO';
    
    if (pessoa[0].email === 'admin@seminario.edu') {
      role = 'ADMIN';
    }

    // Generate new tokens
    const tokens = jwtService.generateTokenPair({
      sub: decoded.sub,
      role,
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
router.post('/logout', asyncHandler(async (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

// GET /auth/me - Get current user info
router.get('/me', asyncHandler(async (req, res) => {
  // This would typically require auth middleware
  // For now, just return a placeholder response
  res.json({
    success: true,
    message: 'User info retrieved',
    data: {
      id: '1',
      nome: 'Admin User',
      email: 'admin@seminario.edu',
      role: 'ADMIN',
    },
  });
}));

export default router; 