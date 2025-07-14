import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock JWT Service
vi.mock('@seminario/shared-auth', () => ({
  jwtService: {
    verifyAccessToken: vi.fn().mockReturnValue({
      sub: '123',
      email: 'test@example.com',
      role: 'ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  },
}));

// Mock database - simplified version
vi.mock('../../../db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock schemas
vi.mock('../../../db/schema', () => ({
  blacklistedTokens: {
    token: 'token',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
  },
}));

// Mock logger
vi.mock('@seminario/shared-config', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocking
import { TokenBlacklistService } from '../../../core/token-blacklist.service';

describe('TokenBlacklistService', () => {
  let tokenBlacklistService: TokenBlacklistService;

  beforeEach(() => {
    tokenBlacklistService = new TokenBlacklistService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic functionality', () => {
    it('should be instantiable', () => {
      expect(tokenBlacklistService).toBeInstanceOf(TokenBlacklistService);
    });

    it('should have blacklistToken method', () => {
      expect(typeof tokenBlacklistService.blacklistToken).toBe('function');
    });

    it('should have isBlacklisted method', () => {
      expect(typeof tokenBlacklistService.isBlacklisted).toBe('function');
    });

    it('should have cleanupExpiredTokens method', () => {
      expect(typeof tokenBlacklistService.cleanupExpiredTokens).toBe('function');
    });
  });

  describe('Basic method calls', () => {
    it('should handle blacklistToken call with invalid token', async () => {
      const token = 'test.token';
      
      // Test that it throws for invalid tokens
      await expect(tokenBlacklistService.blacklistToken(token)).rejects.toThrow('Invalid token format');
    });

    it('should handle isBlacklisted call with invalid token', async () => {
      const token = 'test.token';
      
      // Service catches errors internally and returns false
      const result = await tokenBlacklistService.isBlacklisted(token);
      expect(result).toBe(false);
    });

    it('should handle cleanupExpiredTokens call with mocked db', async () => {
      // Service catches errors internally and returns undefined
      const result = await tokenBlacklistService.cleanupExpiredTokens();
      expect(result).toBeUndefined();
    });
  });
}); 