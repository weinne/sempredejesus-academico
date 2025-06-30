import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock global objects
global.vi = vi;

// Setup global test configuration
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
}); 