/**
 * Setup per test Jest
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/idrodesk_test';
process.env.SKIP_WORKERS = 'true';

// Mock logger per test
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logWithContext: jest.fn(),
  logRequest: jest.fn(),
}));

