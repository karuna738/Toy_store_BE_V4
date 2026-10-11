import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { env } from './env';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    const isPasswordConfigured = Boolean(env.DB_PASSWORD && env.DB_PASSWORD.trim().length > 0);
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: env.DB_CONNECTION_LIMIT,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      decimalNumbers: true
    });
    logger.info(`MySQL connection pool initialized for ${env.DB_USER}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME} (Password configured: ${isPasswordConfigured ? 'YES' : 'NO'})`);
  }
  return pool;
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const isPasswordConfigured = Boolean(env.DB_PASSWORD && env.DB_PASSWORD.trim().length > 0);
    logger.info(`Checking MySQL database connection (Host: ${env.DB_HOST}:${env.DB_PORT}, User: ${env.DB_USER}, DB: ${env.DB_NAME}, Password configured: ${isPasswordConfigured ? 'YES' : 'NO'})...`);
    const connection = await getPool().getConnection();
    await connection.query('SELECT 1 AS connection_test');
    connection.release();
    logger.info('MySQL database connection verified successfully.');
    return true;
  } catch (error) {
    logger.error('Failed to connect to MySQL database:', error);
    return false;
  }
};

export const withTransaction = async <T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> => {
  const currentPool = getPool();
  const connection = await currentPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const closeDatabasePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('MySQL connection pool closed.');
  }
};
