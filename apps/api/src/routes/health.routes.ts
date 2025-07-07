import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * Health check endpoint
 * @route GET /api/health
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Sistema Acadêmico API está funcionando',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Detailed health check with database status
 * @route GET /api/health/detailed
 */
router.get('/detailed', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Sistema Acadêmico API - Health Check Detalhado',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      status: 'connected',
      host: process.env.DB_HOST || 'localhost'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
    }
  });
});

export default router; 