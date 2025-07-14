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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Realiza login no sistema
 *     description: Autentica usuário com email e senha, retornando tokens JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security: []
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renova o token de acesso
 *     description: Gera novo access token usando refresh token válido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token válido
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
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
 *                   example: "Token renovado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: Novo access token
 *       400:
 *         description: Refresh token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security: []
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Realiza logout do sistema
 *     description: Invalida o token atual e realiza logout
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
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
 *                   example: "Logout realizado com sucesso"
 *       401:
 *         description: Token inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - bearerAuth: []
 */

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

  // Check if user is active
  if (userData.isActive !== 'S') {
    throw createError('Account is inactive', 401);
  }

  // Verify password against stored hash
  const bcrypt = require('bcrypt');
  const isValidPassword = await bcrypt.compare(password, userData.passwordHash);

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