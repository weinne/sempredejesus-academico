import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { createJWTStrategy, UserRepository, User, UserRole } from '@seminario/shared-auth';
import { config, logger } from '@seminario/shared-config';
import { db } from '../db';
import { users, pessoas, userRoles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { tokenBlacklistService } from '../core/token-blacklist.service';

// Implement UserRepository interface for our database
const userRepository: UserRepository = {
  async findById(id: string): Promise<User | null> {
    try {
      const result = await db
        .select({
          id: users.id,
          pessoaId: users.pessoaId,
          username: users.username,
          email: pessoas.email,
          role: users.role,
          isActive: users.isActive,
          nomeCompleto: pessoas.nomeCompleto,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .leftJoin(pessoas, eq(users.pessoaId, pessoas.id))
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) return null;

      const userData = result[0];
      const base: User = {
        id: userData.id.toString(),
        email: userData.email || '',
        nome: userData.nomeCompleto || userData.username,
        role: userData.role as UserRole,
        pessoaId: userData.pessoaId.toString(),
        ativo: userData.isActive === 'S',
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      // fetch additional roles
      const extra = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, userData.id));
      const roles = [base.role, ...extra.map(r => r.role as UserRole)]
        .filter((v, i, arr) => arr.indexOf(v) === i);
      return { ...base, roles } as User;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      return null;
    }
  },

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db
        .select({
          id: users.id,
          pessoaId: users.pessoaId,
          username: users.username,
          email: pessoas.email,
          role: users.role,
          isActive: users.isActive,
          nomeCompleto: pessoas.nomeCompleto,
          passwordHash: users.passwordHash,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .leftJoin(pessoas, eq(users.pessoaId, pessoas.id))
        .where(eq(pessoas.email, email))
        .limit(1);

      if (result.length === 0) return null;

      const userData = result[0];
      const base: User & { senha: string } = {
        id: userData.id.toString(),
        email: userData.email || '',
        nome: userData.nomeCompleto || userData.username,
        role: userData.role as UserRole,
        pessoaId: userData.pessoaId.toString(),
        ativo: userData.isActive === 'S',
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        senha: userData.passwordHash,
      };
      const extra = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, userData.id));
      const roles = [base.role, ...extra.map(r => r.role as UserRole)]
        .filter((v, i, arr) => arr.indexOf(v) === i);
      return { ...base, roles } as User & { senha: string };
    } catch (error) {
      logger.error('Error finding user by email:', error);
      return null;
    }
  },
};

// Configure JWT strategy
const jwtStrategy = createJWTStrategy({
  jwtSecret: config.jwt.secret,
  userRepository,
});

passport.use(jwtStrategy);

// Middleware to require authentication
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  // Check if token is blacklisted
  if (token) {
    try {
      const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - Token has been revoked',
        });
      }
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      // Continue with normal authentication if blacklist check fails
    }
  }

  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      logger.error('Authentication error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid or expired token',
      });
    }

    req.user = user as User;
    next();
  })(req, res, next);
};

// Middleware to require specific roles
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any; // Type assertion to bypass conflicts
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No user context',
      });
    }

    const userRole = user.role as string;
    const userRolesList: string[] = Array.isArray(user.roles) ? user.roles : [userRole];
    const ok = userRolesList.some(r => allowedRoles.includes(r));
    if (!ok) {
      logger.warn(`Access denied for user ${user.id} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions',
        data: {
          required: allowedRoles,
          current: userRolesList,
        },
      });
    }

    next();
  };
};

// Convenience middleware for common role combinations
export const requireAdmin = requireRole('ADMIN');
export const requireSecretaria = requireRole('ADMIN', 'SECRETARIA');
export const requireProfessor = requireRole('ADMIN', 'SECRETARIA', 'PROFESSOR');
export const requireAluno = requireRole('ADMIN', 'SECRETARIA', 'PROFESSOR', 'ALUNO');

// Note: Using Passport's built-in User type extension 