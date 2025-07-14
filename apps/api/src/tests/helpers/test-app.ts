import express, { Express } from 'express';
import { config } from '@seminario/shared-config';

// Import routes
import authRoutes from '../../routes/auth.routes';
import pessoasRoutes from '../../routes/pessoas.routes';
import alunosRoutes from '../../routes/alunos.routes';
import professoresRoutes from '../../routes/professores.routes';
import cursosRoutes from '../../routes/cursos.routes';
import disciplinasRoutes from '../../routes/disciplinas.routes';
import turmasRoutes from '../../routes/turmas.routes';
import healthRoutes from '../../routes/health.routes';

// Import middleware
import { errorHandler, notFoundHandler } from '../../middleware/error.middleware';
import { securityHeaders, requestMonitoring, apiVersion } from '../../middleware/security.middleware';

export async function createTestApp(): Promise<Express> {
  const app = express();

  // Apply basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Apply security middleware (with test configuration)
  app.use(securityHeaders);
  app.use(requestMonitoring);
  app.use(apiVersion);

  // Register routes
  app.use('/api/auth', authRoutes);
  app.use('/api/pessoas', pessoasRoutes);
  app.use('/api/alunos', alunosRoutes);
  app.use('/api/professores', professoresRoutes);
  app.use('/api/cursos', cursosRoutes);
  app.use('/api/disciplinas', disciplinasRoutes);
  app.use('/api/turmas', turmasRoutes);
  app.use('/api/health', healthRoutes);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export async function setupTestDatabase(): Promise<void> {
  // In a real implementation, this would:
  // 1. Create a test database
  // 2. Run migrations
  // 3. Seed with minimal test data
  
  // For now, we'll assume the test database is already configured
  // via environment variables in the test setup
}

export async function teardownTestDatabase(): Promise<void> {
  // In a real implementation, this would:
  // 1. Clean up all test data
  // 2. Close database connections
  // 3. Remove test database if needed
} 