import jwt from 'jsonwebtoken';
import { JWTPayload, RefreshTokenPayload, TokenPair, User } from './types.js';

export class JWTService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || '1h';
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

    if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      console.warn('JWT secrets not configured in environment variables');
    }
  }

  /**
   * Gera um access token para o usuário
   */
  generateAccessToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
      pessoaId: user.pessoaId,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
      algorithm: 'HS256',
    });
  }

  /**
   * Gera um refresh token para o usuário
   */
  generateRefreshToken(userId: string): string {
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      sub: userId,
      type: 'refresh',
    };

    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiry,
      algorithm: 'HS256',
    });
  }

  /**
   * Gera um par de tokens (access + refresh)
   */
  generateTokenPair(user: User): TokenPair {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user.id),
    };
  }

  /**
   * Verifica e decodifica um access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as JWTPayload;

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      }
      throw new Error('Erro ao verificar token');
    }
  }

  /**
   * Verifica e decodifica um refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const payload = jwt.verify(token, this.jwtRefreshSecret, {
        algorithms: ['HS256'],
      }) as RefreshTokenPayload;

      if (payload.type !== 'refresh') {
        throw new Error('Tipo de token inválido');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Refresh token inválido');
      }
      throw new Error('Erro ao verificar refresh token');
    }
  }

  /**
   * Extrai o token do header Authorization
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      return null;
    }
    
    return token;
  }

  /**
   * Obtém o tempo de expiração em segundos
   */
  getTokenExpiryTime(): number {
    const match = this.accessTokenExpiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 3600;
      case 'd': return num * 86400;
      default: return 3600;
    }
  }

  /**
   * Verifica se um token está próximo do vencimento
   */
  isTokenExpiringSoon(token: string, thresholdMinutes = 5): boolean {
    try {
      const payload = this.verifyAccessToken(token);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      return timeUntilExpiry < (thresholdMinutes * 60);
    } catch {
      return true; // Se não conseguir verificar, considerar como expirando
    }
  }

  /**
   * Gera um token para reset de senha
   */
  generatePasswordResetToken(email: string): string {
    const payload = {
      email,
      type: 'password-reset',
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '1h', // Token de reset expira em 1 hora
      algorithm: 'HS256',
    });
  }

  /**
   * Verifica um token de reset de senha
   */
  verifyPasswordResetToken(token: string): { email: string } {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as any;

      if (payload.type !== 'password-reset') {
        throw new Error('Tipo de token inválido');
      }

      return { email: payload.email };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token de reset expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token de reset inválido');
      }
      throw new Error('Erro ao verificar token de reset');
    }
  }
}

// Export singleton instance
export const jwtService = new JWTService(); 