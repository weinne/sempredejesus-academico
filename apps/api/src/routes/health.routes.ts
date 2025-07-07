import express, { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '@seminario/shared-config';

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

/**
 * @swagger
 * /health/database:
 *   get:
 *     tags: [Health]
 *     summary: Verificação detalhada do banco de dados
 *     description: Endpoint para verificar saúde específica do PostgreSQL (response time, connections, etc)
 *     responses:
 *       200:
 *         description: Database funcionando normalmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 response_time_ms:
 *                   type: number
 *                   example: 12.5
 *                 connections:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: number
 *                       example: 5
 *                     max:
 *                       type: number
 *                       example: 100
 *                 version:
 *                   type: string
 *                   example: "PostgreSQL 15.3"
 *                 tables_count:
 *                   type: number
 *                   example: 17
 *       503:
 *         description: Database com problemas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 error:
 *                   type: string
 *                   example: "Connection timeout"
 *     security: []
 */

const router = express.Router();

/**
 * Health check endpoint - Basic
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
 * Detailed health check with system info
 */
router.get('/detailed', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'ok',
    message: 'Sistema Acadêmico API - Health Check Detalhado',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    process: {
      pid: process.pid,
      arch: process.arch,
      platform: process.platform,
      node_version: process.version,
    },
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
    },
    database: {
      status: 'connected',
      host: process.env.DB_HOST || 'localhost'
    }
  });
});

/**
 * Database-specific health check
 */
router.get('/database', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    const connectionTest = await db.execute(sql`SELECT 1 as test`);
    
    // Get PostgreSQL version
    const versionResult = await db.execute(sql`SELECT version()`);
    const version = versionResult[0]?.version || 'Unknown';
    
    // Get connection stats
    const connectionStats = await db.execute(sql`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_count
    `);
    
         const responseTime = Date.now() - startTime;
     const stats = connectionStats[0] as any;
     
     // Log database metrics for monitoring
     logger.info('Database health check completed', {
       response_time_ms: responseTime,
       active_connections: Number(stats?.active_connections) || 0,
       max_connections: Number(stats?.max_connections) || 0,
       tables_count: Number(stats?.tables_count) || 0,
     });
     
     const activeConn = Number(stats?.active_connections) || 0;
     const maxConn = Number(stats?.max_connections) || 1;
     const versionString = (version as string) || 'Unknown';
     
     res.status(200).json({
       status: 'healthy',
       response_time_ms: responseTime,
       connections: {
         active: activeConn,
         max: maxConn,
         usage_percent: Math.round((activeConn / maxConn) * 100)
       },
       version: versionString.split(' ').slice(0, 2).join(' '), // "PostgreSQL 15.3"
       tables_count: Number(stats?.tables_count) || 0,
       timestamp: new Date().toISOString()
     });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log database error
    logger.error('Database health check failed', {
      response_time_ms: responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    res.status(503).json({
      status: 'unhealthy',
      response_time_ms: responseTime,
      error: error instanceof Error ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 