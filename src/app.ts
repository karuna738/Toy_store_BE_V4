import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import apiRouter from './routes';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/error.middleware';
import { openApiSpec } from './config/swagger';
import { sendError } from './utils/apiResponse';
import { logger } from './utils/logger';

export const app: Application = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration: Explicitly approved local development origins (React Frontend & Swagger UI)
const allowedOrigins = new Set<string>([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
]);

if (env.CLIENT_URL) {
  env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed) {
      allowedOrigins.add(trimmed);
      if (trimmed.startsWith('http://localhost:')) {
        allowedOrigins.add(trimmed.replace('http://localhost:', 'http://127.0.0.1:'));
      } else if (trimmed.startsWith('http://127.0.0.1:')) {
        allowedOrigins.add(trimmed.replace('http://127.0.0.1:', 'http://localhost:'));
      }
    }
  });
}

if (env.SERVER_URL) {
  const trimmed = env.SERVER_URL.trim();
  if (trimmed) {
    allowedOrigins.add(trimmed);
    if (trimmed.startsWith('http://localhost:')) {
      allowedOrigins.add(trimmed.replace('http://localhost:', 'http://127.0.0.1:'));
    } else if (trimmed.startsWith('http://127.0.0.1:')) {
      allowedOrigins.add(trimmed.replace('http://127.0.0.1:', 'http://localhost:'));
    }
  }
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    // Safe logging: log rejected origin only; never log credentials, tokens, or body
    logger.warn(`CORS access blocked by policy for Origin: '${origin}'`);
    return callback(new Error(`CORS access blocked by policy for Origin: '${origin}'`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body Parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global Rate Limiting
app.use('/api', globalRateLimiter);

// Static Uploads Serving
const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDirectory));

// Interactive OpenAPI Documentation (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// API Route Mount
app.use('/api', apiRouter);

// 404 Route Catch-All
app.use('*', (req: Request, res: Response) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
