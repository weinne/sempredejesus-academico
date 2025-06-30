import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { JwtStrategy } from '@seminario/shared-auth';
import { config, logger } from '@seminario/shared-config';
import { JwtPayload } from '@seminario/shared-dtos';

// Configure JWT strategy
const jwtStrategy = new JwtStrategy(
  config.jwt.secret,
  async (payload: JwtPayload, done) => {
    try {
      // Here you would typically fetch user from database
      // For now, we'll just validate the payload structure
      if (payload.sub && payload.role) {
        return done(null, payload);
      }
      return done(null, false);
    } catch (error) {
      logger.error('JWT Strategy error:', error);
      return done(error, false);
    }
  }
);

passport.use(jwtStrategy);

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: JwtPayload) => {
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

    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to require specific roles
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No user context',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions',
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

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
} 