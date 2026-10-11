import { beforeAll, afterAll } from 'vitest';
import { closeDatabasePool } from '../src/config/database';

beforeAll(async () => {
  // Test suite initialization
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Close database pool to allow clean test exit
  await closeDatabasePool();
});
