import express, { Request, Response } from 'express';

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Verifica saúde da API
 *     description: Endpoint para verificar se a API está funcionando corretamente
 *     responses:
 *       200:
 *         description: API funcionando normalmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "Sistema Acadêmico API está funcionando"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Tempo de atividade em segundos
 *                   example: 3600.25
 *                 environment:
 *                   type: string
 *                   example: "development"
 *     security: []
 */

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     tags: [Health]
 *     summary: Health check detalhado
 *     description: Endpoint para verificar status detalhado da API incluindo database e memória
 *     responses:
 *       200:
 *         description: Status detalhado da API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "Sistema Acadêmico API - Health Check Detalhado"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 3600.25
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "connected"
 *                     host:
 *                       type: string
 *                       example: "localhost"
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                       description: Memória usada em MB
 *                       example: 45.67
 *                     total:
 *                       type: number
 *                       description: Memória total em MB
 *                       example: 128.5
 *     security: []
 */

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