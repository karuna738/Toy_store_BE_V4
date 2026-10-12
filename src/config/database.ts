import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { env } from './env';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: env.DB_CONNECTION_LIMIT,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      decimalNumbers: true
    });
  }
  return pool;
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const connection = await getPool().getConnection();
    await connection.query('SELECT 1');
    connection.release();
    return true;
  } catch (error) {
    logger.error('Failed to connect to MySQL database:', error);
    return false;
  }
};

export const withTransaction = async <T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await getPool().getConnection();
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
  }
};
