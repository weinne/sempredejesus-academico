import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { beforeAll, beforeEach, afterEach } from 'vitest';

// Setup environment variables for tests
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-256-bit-key-for-testing-purposes-only-do-not-use-in-production';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-256-bit-key-for-testing-purposes-only';
  
  // Use the existing database but with proper credentials for testing
  // In a real scenario, this would be a separate test database
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:senha123@191.252.100.138:5432/seminario_db';
  
  process.env.PORT = '4001';
  process.env.API_URL = 'http://localhost:4001';
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-for-testing-purposes-only';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Mock logger to avoid console spam in tests
vi.mock('@seminario/shared-config', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  config: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
      refreshSecret: process.env.REFRESH_TOKEN_SECRET,
      refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    },
    database: {
      url: process.env.DATABASE_URL,
    },
    server: {
      port: 4000,
      environment: 'test',
    },
  },
}));

// Global test utilities
declare global {
  var mockConsole: {
    log: MockedFunction<any>;
    error: MockedFunction<any>;
    warn: MockedFunction<any>;
  };
}

// Mock console methods to avoid spam during tests
global.mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

// Setup global mocks
beforeEach(() => {
  vi.clearAllMocks();
});

// Cleanup after tests
afterEach(() => {
  vi.restoreAllMocks();
}); 