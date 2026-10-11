import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Ensure .env is loaded from the backend project root regardless of the current working directory (process.cwd())
const backendRootDir = path.resolve(__dirname, '../../');
const backendEnvPath = path.resolve(backendRootDir, '.env');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(cwdEnvPath)) {
  dotenv.config({ path: cwdEnvPath });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SERVER_URL: z.string().default('http://localhost:5000'),

  // JWT Configuration
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long').default('toyverse_super_secret_jwt_key_default_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // MySQL Database Configuration
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.string().transform(Number).default('3306'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('toyverse_db'),
  DB_CONNECTION_LIMIT: z.string().transform(Number).default('10'),

  // Initial Admin Seed Configuration
  ADMIN_NAME: z.string().default('Store Admin'),
  ADMIN_EMAIL: z.string().email().default('admin@toyverse.demo'),
  ADMIN_PASSWORD: z.string().min(6).default('admin123'),
  ADMIN_PHONE: z.string().default('9000000001'),
  ADMIN_ADDRESS: z.string().default('ToyVerse HQ, Anna Salai, Chennai 600002'),

  // E-Commerce Business Rules
  LOW_STOCK_LIMIT: z.string().transform(Number).default('5'),
  FREE_DELIVERY_THRESHOLD: z.string().transform(Number).default('999'),
  DELIVERY_FEE: z.string().transform(Number).default('49'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('20')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables configuration:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
