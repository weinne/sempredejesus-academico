import jwt from 'jsonwebtoken';
import { JwtPayload, TokenPair } from './types';

export class JwtService {
  constructor(
    private readonly secret: string,
    private readonly refreshSecret: string,
    private readonly expiresIn: string = '7d'
  ) {}

  generateTokenPair(payload: Omit<JwtPayload, 'exp' | 'iat'>): TokenPair {
    const accessToken = jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });

    const refreshToken = jwt.sign(
      { sub: payload.sub },
      this.refreshSecret,
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }

  verifyRefreshToken(token: string): { sub: string } {
    return jwt.verify(token, this.refreshSecret) as { sub: string };
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
} 