import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { config, logger } from '@seminario/shared-config';
import { testConnection, closeConnection } from './db';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import swaggerSpec from './config/swagger';
import { ensureLoginTestUsers } from './scripts/seed-mock-users';

// Import routes
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import metricsRoutes from './routes/metrics.routes';
import pessoasRoutes from './routes/pessoas.routes';
import alunosRoutes from './routes/alunos.routes';
import professoresRoutes from './routes/professores.routes';
import cursosRoutes from './routes/cursos.routes';
import turnosRoutes from './routes/turnos.routes';
import disciplinasRoutes from './routes/disciplinas.routes';
import periodosRoutes from './routes/periodos.routes';
import curriculosRoutes from './routes/curriculos.routes';
import coortesRoutes from './routes/coortes.routes';
import turmasRoutes from './routes/turmas.routes';
import usersRoutes from './routes/users.routes';
import meRoutes from './routes/me.routes';
import avaliacoesRoutes from './routes/avaliacoes.routes';
import aulasRoutes from './routes/aulas.routes';
import calendarioRoutes from './routes/calendario.routes';
import reportsRoutes from './routes/reports.routes';

// Import middleware
import { securityHeaders, requestMonitoring, apiVersion } from './middleware/security.middleware';
import { metricsMiddleware } from './routes/metrics.routes';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
      connectSrc: [
        "'self'",
        config.server.apiUrl,
        config.server.appUrl,
        'http://localhost:3000',
        'http://localhost:4000',
        'https://siga.sempredejesus.org.br',
        'https://www.siga.sempredejesus.org.br',
      ],
    },
  },
}));

// Production security headers
app.use(securityHeaders);
app.use(apiVersion);
app.use(requestMonitoring);
app.use(metricsMiddleware);

// CORS configuration (allow same-origin and configured domains)
const allowedOrigins = new Set<string>([
  config.server.appUrl,
  config.server.apiUrl,
  'http://localhost:3000',
  'http://localhost:4000',
  'https://siga.sempredejesus.org.br',
  'https://www.siga.sempredejesus.org.br',
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // Same-origin or non-browser request
      return callback(null, true);
    }
    try {
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      const hostname = new URL(origin).hostname;
      if (hostname.endsWith('sempredejesus.org.br')) {
        return callback(null, true);
      }
    } catch {
      // If URL parsing fails, deny by default
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Passport initialization
app.use(passport.initialize());

// Request logging in development
if (config.server.nodeEnv === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
    });
    next();
  });
}

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sistema Acadêmico Seminário - API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
}));

// Swagger JSON spec endpoint
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check and monitoring endpoints
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// API routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/pessoas', pessoasRoutes);
apiRouter.use('/alunos', alunosRoutes);
apiRouter.use('/professores', professoresRoutes);
apiRouter.use('/cursos', cursosRoutes);
apiRouter.use('/turnos', turnosRoutes);
apiRouter.use('/disciplinas', disciplinasRoutes);
apiRouter.use('/periodos', periodosRoutes);
apiRouter.use('/curriculos', curriculosRoutes);
apiRouter.use('/coortes', coortesRoutes);
apiRouter.use('/turmas', turmasRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/me', meRoutes);
apiRouter.use('/avaliacoes', avaliacoesRoutes);
apiRouter.use('/aulas', aulasRoutes);
apiRouter.use('/calendario', calendarioRoutes);
apiRouter.use('/reports', reportsRoutes);

app.use('/api', apiRouter);

// Serve static files from portal build (SPA). Do this regardless of NODE_ENV if bundle exists
app.use(express.static('public'));

// Catch-all handler for SPA (non-API routes only)
app.get(/^(?!\/api).*/, (req: Request, res: Response) => {
  res.sendFile('index.html', { root: 'public' });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Em desenvolvimento, garantir que os usuários de teste da tela de login existam
    if (config.server.nodeEnv === 'development') {
      try {
        await ensureLoginTestUsers();
      } catch (error) {
        logger.warn('Failed to ensure login test users (non-critical):', error);
        // Não bloqueia o startup se falhar
      }
    }

    // Start server
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📚 Environment: ${config.server.nodeEnv}`);
      logger.info(`🔗 API URL: ${config.server.apiUrl}`);
      if (config.server.nodeEnv === 'development') {
        logger.info(`📖 API Docs: ${config.server.apiUrl}/docs`);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await closeConnection();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app; 
