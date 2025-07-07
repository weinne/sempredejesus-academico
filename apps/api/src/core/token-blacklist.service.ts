import { db } from '../db';
import { blacklistedTokens } from '../db/schema';
import { eq } from 'drizzle-orm';
import { jwtService } from '@seminario/shared-auth';

export class TokenBlacklistService {
  /**
   * Add a token to the blacklist
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      // Use jwtService to verify and get token info
      const decoded = jwtService.verifyAccessToken(token);
      
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token format');
      }

      const expiresAt = new Date(decoded.exp * 1000);
      const jti = this.generateJti(token);

      await db.insert(blacklistedTokens).values({
        jti,
        token,
        expiresAt,
      });
    } catch (error) {
      console.error('Error blacklisting token:', error);
      // Even if verification fails, we can still blacklist based on token content
      try {
        const jti = this.generateJti(token);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h fallback
        
        await db.insert(blacklistedTokens).values({
          jti,
          token,
          expiresAt,
        });
      } catch (fallbackError) {
        throw error;
      }
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const jti = this.generateJti(token);
      
      const result = await db
        .select()
        .from(blacklistedTokens)
        .where(eq(blacklistedTokens.jti, jti))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error checking blacklist:', error);
      return false;
    }
  }

  /**
   * Clean up expired tokens from blacklist (optional maintenance)
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      await db
        .delete(blacklistedTokens)
        .where(eq(blacklistedTokens.expiresAt, new Date()));
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }

  /**
   * Generate a consistent JTI for tokens that don't have one
   */
  private generateJti(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 50);
  }
}

export const tokenBlacklistService = new TokenBlacklistService(); 