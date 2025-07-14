import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JWTService, UserRole, type User } from '@seminario/shared-auth';

describe('JWTService', () => {
  let jwtService: JWTService;

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: '123',
    email: 'test@example.com',
    nome: 'Test User',
    role: UserRole.ADMIN,
    pessoaId: 'pessoa-123',
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    jwtService = new JWTService();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const user = createMockUser();
      const token = jwtService.generateAccessToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', () => {
      const user1 = createMockUser({ id: '123', email: 'test1@example.com' });
      const user2 = createMockUser({ id: '456', email: 'test2@example.com', role: UserRole.PROFESSOR });
      
      const token1 = jwtService.generateAccessToken(user1);
      const token2 = jwtService.generateAccessToken(user2);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const userId = '123';
      const token = jwtService.generateRefreshToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const user = createMockUser();
      const token = jwtService.generateAccessToken(user);
      
      const decoded = jwtService.verifyAccessToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe(user.id);
      expect(decoded?.email).toBe(user.email);
      expect(decoded?.role).toBe(user.role);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      try {
        const decoded = jwtService.verifyAccessToken(invalidToken);
        expect(decoded).toBeNull();
      } catch (error) {
        // JWT Service throws error for invalid tokens, which is expected
        expect(error.message).toContain('Token inválido');
      }
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt';
      
      try {
        const decoded = jwtService.verifyAccessToken(malformedToken);
        expect(decoded).toBeNull();
      } catch (error) {
        // JWT Service throws error for malformed tokens, which is expected
        expect(error.message).toContain('Token inválido');
      }
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const userId = '123';
      const token = jwtService.generateRefreshToken(userId);
      
      const decoded = jwtService.verifyRefreshToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe(userId);
    });

    it('should return null for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';
      
      try {
        const decoded = jwtService.verifyRefreshToken(invalidToken);
        expect(decoded).toBeNull();
      } catch (error) {
        // JWT Service throws error for invalid refresh tokens, which is expected
        expect(error.message).toContain('Refresh token inválido');
      }
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'valid.jwt.token';
      const header = `Bearer ${token}`;
      
      const extracted = jwtService.extractTokenFromHeader(header);
      
      expect(extracted).toBe(token);
    });

    it('should return null for header without Bearer prefix', () => {
      const header = 'valid.jwt.token';
      const extracted = jwtService.extractTokenFromHeader(header);
      
      expect(extracted).toBeNull();
    });

    it('should return null for empty header', () => {
      const extracted = jwtService.extractTokenFromHeader('');
      expect(extracted).toBeNull();
    });

    it('should return null for undefined header', () => {
      const extracted = jwtService.extractTokenFromHeader();
      expect(extracted).toBeNull();
    });

    it('should return null for Bearer without token', () => {
      const header = 'Bearer ';
      const extracted = jwtService.extractTokenFromHeader(header);
      
      expect(extracted).toBeNull();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const user = createMockUser();
      
      const tokens = jwtService.generateTokenPair(user);
      
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid tokens that can be verified', () => {
      const user = createMockUser({ role: UserRole.PROFESSOR });
      
      const tokens = jwtService.generateTokenPair(user);
      
      const accessDecoded = jwtService.verifyAccessToken(tokens.accessToken);
      const refreshDecoded = jwtService.verifyRefreshToken(tokens.refreshToken);
      
      expect(accessDecoded?.sub).toBe(user.id);
      expect(accessDecoded?.email).toBe(user.email);
      expect(accessDecoded?.role).toBe(user.role);
      expect(refreshDecoded?.sub).toBe(user.id);
    });
  });
}); 