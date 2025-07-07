import { Request, Response, NextFunction } from 'express';
import { logger } from '@seminario/shared-config';

/**
 * Security Headers Middleware
 * Adds production-ready security headers
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // For Swagger UI
    "style-src 'self' 'unsafe-inline'", // For Swagger UI
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '));

  // Remove powered by header
  res.removeHeader('X-Powered-By');

  // Server header
  res.setHeader('Server', 'Sistema Academico API');

  next();
};

/**
 * Request Rate Monitoring
 * Logs suspicious activity
 */
export const requestMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    const isSlow = duration > 5000; // 5 seconds

    // Log suspicious activity
    if (isError || isSlow) {
      logger.warn('Suspicious request detected', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration_ms: duration,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        is_error: isError,
        is_slow: isSlow,
      });
    }

    // Log slow queries for monitoring
    if (duration > 1000) {
      logger.info('Slow request detected', {
        method: req.method,
        url: req.url,
        duration_ms: duration,
        status: res.statusCode,
      });
    }
  });

  next();
};

/**
 * API Version Header
 */
export const apiVersion = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-API-Environment', process.env.NODE_ENV || 'development');
  next();
}; 