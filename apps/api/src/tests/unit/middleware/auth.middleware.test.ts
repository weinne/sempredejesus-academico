import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock all dependencies before imports
vi.mock('../../../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('../../../db/schema', () => ({
  users: 'users_table',
  pessoas: 'pessoas_table',
}));

vi.mock('@seminario/shared-config', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  config: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '15m',
    },
  },
}));

vi.mock('@seminario/shared-auth', () => ({
  createJWTStrategy: vi.fn(),
  UserRepository: vi.fn(),
  User: vi.fn(),
  UserRole: vi.fn(),
}));

vi.mock('../../../core/token-blacklist.service', () => ({
  tokenBlacklistService: {
    isBlacklisted: vi.fn(),
  },
}));

vi.mock('passport', () => ({
  default: {
    use: vi.fn(),
    authenticate: vi.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        // Simple mock that just calls next
        next();
      };
    }),
  },
}));

// Import after all mocks are set up
import { requireAuth, requireRole } from '../../../middleware/auth.middleware';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined,
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn() as unknown as NextFunction;
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should be a function', () => {
      expect(typeof requireAuth).toBe('function');
    });

    it('should exist and be importable', () => {
      expect(requireAuth).toBeDefined();
    });
  });

  describe('requireRole', () => {
    it('should be a function', () => {
      expect(typeof requireRole).toBe('function');
    });

    it('should return a middleware function', () => {
      const middleware = requireRole('ADMIN');
      expect(typeof middleware).toBe('function');
    });

    it('should allow access for authorized role', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'ADMIN',
      };

      mockRequest.user = mockUser as any;
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'ALUNO',
      };

      mockRequest.user = mockUser as any;
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when no user in request', () => {
      delete mockRequest.user;
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple roles', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'SECRETARIA',
      };

      mockRequest.user = mockUser as any;
      const middleware = requireRole('ADMIN', 'SECRETARIA');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle PROFESSOR role access', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'PROFESSOR',
      };

      mockRequest.user = mockUser as any;
      const middleware = requireRole('PROFESSOR');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle ALUNO role access', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'ALUNO',
      };

      mockRequest.user = mockUser as any;
      const middleware = requireRole('ALUNO');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
}); 