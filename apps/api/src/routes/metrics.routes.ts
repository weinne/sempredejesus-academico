import express, { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '@seminario/shared-config';

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags: [Monitoring]
 *     summary: Métricas da aplicação
 *     description: Endpoint para coletar métricas da aplicação (Prometheus format)
 *     responses:
 *       200:
 *         description: Métricas em formato Prometheus
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP api_uptime_seconds Application uptime in seconds
 *                 # TYPE api_uptime_seconds counter
 *                 api_uptime_seconds 3600.25
 *     security: []
 */

const router = express.Router();

// Metrics collection
interface AppMetrics {
  requestCount: number;
  errorCount: number;
  startTime: number;
  databaseQueries: number;
  authAttempts: {
    success: number;
    failed: number;
  };
}

const metrics: AppMetrics = {
  requestCount: 0,
  errorCount: 0,
  startTime: Date.now(),
  databaseQueries: 0,
  authAttempts: {
    success: 0,
    failed: 0
  }
};

// Middleware to count requests (add this to server.ts)
export const metricsMiddleware = (req: Request, res: Response, next: any) => {
  metrics.requestCount++;
  
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }
    return originalSend.call(this, data);
  };
  
  next();
};

// Functions to update metrics (export these)
export const updateMetrics = {
  incrementDbQueries: () => metrics.databaseQueries++,
  incrementAuthSuccess: () => metrics.authAttempts.success++,
  incrementAuthFailed: () => metrics.authAttempts.failed++,
};

/**
 * Prometheus metrics endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const uptime = (Date.now() - metrics.startTime) / 1000;
    const memUsage = process.memoryUsage();
    
    // Get database metrics
    let dbMetrics = {
      activeConnections: 0,
      totalTables: 0,
      totalUsers: 0,
      totalAlunos: 0,
      dbResponseTime: 0
    };
    
    try {
      const startDbTime = Date.now();
      
      const [connectionStats, tableStats, userStats, alunoStats] = await Promise.all([
        db.execute(sql`SELECT count(*) as active FROM pg_stat_activity WHERE state = 'active'`),
        db.execute(sql`SELECT count(*) as tables FROM information_schema.tables WHERE table_schema = 'public'`),
        db.execute(sql`SELECT count(*) as users FROM users`),
        db.execute(sql`SELECT count(*) as alunos FROM alunos`)
      ]);
      
      dbMetrics = {
        activeConnections: Number(connectionStats[0]?.active) || 0,
        totalTables: Number(tableStats[0]?.tables) || 0,
        totalUsers: Number(userStats[0]?.users) || 0,
        totalAlunos: Number(alunoStats[0]?.alunos) || 0,
        dbResponseTime: Date.now() - startDbTime
      };
      
    } catch (error) {
      logger.error('Failed to collect database metrics', error);
    }
    
    // Format in Prometheus format
    const prometheusMetrics = `
# HELP api_uptime_seconds Application uptime in seconds
# TYPE api_uptime_seconds counter
api_uptime_seconds ${uptime}

# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total ${metrics.requestCount}

# HELP api_errors_total Total number of API errors (4xx/5xx)
# TYPE api_errors_total counter
api_errors_total ${metrics.errorCount}

# HELP api_memory_usage_bytes Memory usage in bytes
# TYPE api_memory_usage_bytes gauge
api_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}
api_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}
api_memory_usage_bytes{type="rss"} ${memUsage.rss}

# HELP api_database_queries_total Total database queries executed
# TYPE api_database_queries_total counter
api_database_queries_total ${metrics.databaseQueries}

# HELP api_database_connections_active Active database connections
# TYPE api_database_connections_active gauge
api_database_connections_active ${dbMetrics.activeConnections}

# HELP api_database_response_time_ms Database response time in milliseconds
# TYPE api_database_response_time_ms gauge
api_database_response_time_ms ${dbMetrics.dbResponseTime}

# HELP api_auth_attempts_total Authentication attempts
# TYPE api_auth_attempts_total counter
api_auth_attempts_total{result="success"} ${metrics.authAttempts.success}
api_auth_attempts_total{result="failed"} ${metrics.authAttempts.failed}

# HELP api_business_metrics Business logic metrics
# TYPE api_business_metrics gauge
api_business_metrics{type="total_users"} ${dbMetrics.totalUsers}
api_business_metrics{type="total_alunos"} ${dbMetrics.totalAlunos}
api_business_metrics{type="total_tables"} ${dbMetrics.totalTables}

# HELP api_error_rate Error rate percentage
# TYPE api_error_rate gauge
api_error_rate ${metrics.requestCount > 0 ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) : 0}
`.trim();

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(prometheusMetrics);
    
  } catch (error) {
    logger.error('Failed to generate metrics', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

/**
 * JSON metrics endpoint (alternative format)
 */
router.get('/json', async (req: Request, res: Response) => {
  try {
    const uptime = (Date.now() - metrics.startTime) / 1000;
    const memUsage = process.memoryUsage();
    
    res.json({
      timestamp: new Date().toISOString(),
      uptime_seconds: uptime,
      requests: {
        total: metrics.requestCount,
        errors: metrics.errorCount,
        error_rate: metrics.requestCount > 0 ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) : 0
      },
      memory: {
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
        rss_mb: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100
      },
      database: {
        queries_total: metrics.databaseQueries
      },
      auth: {
        success_total: metrics.authAttempts.success,
        failed_total: metrics.authAttempts.failed
      }
    });
    
  } catch (error) {
    logger.error('Failed to generate JSON metrics', error);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

export default router; 