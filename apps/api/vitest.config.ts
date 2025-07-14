import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/setup.ts',
        '**/test-*.ts',
        '**/*.test.ts'
      ]
    },
    // Separate test environments
    testTimeout: 15000,
    hookTimeout: 15000,
    // Skip integration tests by default in unit test mode
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/integration/**'
    ]
  },
}); 