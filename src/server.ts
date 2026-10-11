import { env } from './config/env';
import { app } from './app';
import { checkDatabaseConnection, closeDatabasePool } from './config/database';
import { logger } from './utils/logger';
import { Server } from 'http';

let server: Server | null = null;

const startServer = async (): Promise<void> => {
  logger.info(`Starting ToyVerse backend service in ${env.NODE_ENV} mode...`);

  // Verify database connection on startup
  await checkDatabaseConnection();

  server = app.listen(env.PORT, () => {
    logger.info(`Server successfully listening on port ${env.PORT}`);
    logger.info(`API Base URL: http://localhost:${env.PORT}/api`);
    logger.info(`Swagger Documentation: http://localhost:${env.PORT}/api-docs`);
  });

  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    if (server) {
      server.close(async () => {
        logger.info('HTTP server closed.');
        await closeDatabasePool();
        logger.info('Graceful shutdown complete.');
        process.exit(0);
      });
    } else {
      await closeDatabasePool();
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default server;
