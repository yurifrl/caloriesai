import { vi, beforeAll, afterAll } from 'vitest';
import Redis from 'ioredis';

// Set environment variables for tests
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Redis client for cleanup between tests
export const redis = new Redis(process.env.REDIS_URL);

// Clean up Redis before all tests
beforeAll(async () => {
  // Flush all data from Redis
  await redis.flushall();
});

// Clean up after all tests are done
afterAll(async () => {
  // Flush all data and close connection
  await redis.flushall();
  await redis.quit();
});

// Mock console methods to reduce noise during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {}); 