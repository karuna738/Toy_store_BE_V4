import { getPool, closeDatabasePool } from './database';
import { env } from './env';
import { hashPassword } from '../utils/password';
import { logger } from '../utils/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export const runSeed = async (): Promise<void> => {
  const pool = getPool();
  try {
    logger.info('Starting database seeding...');

    // 1. Check or Seed Admin Account
    const [existingAdmins] = await pool.query<RowDataPacket[]>(
      'SELECT id, email FROM users WHERE role = ? LIMIT 1',
      ['ADMIN']
    );

    if (existingAdmins.length === 0) {
      logger.info(`No admin account detected. Creating admin: ${env.ADMIN_EMAIL}`);
      const hashedPassword = await hashPassword(env.ADMIN_PASSWORD);
      await pool.query<ResultSetHeader>(
        `INSERT INTO users (name, email, phone, address, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, ?, 'ADMIN', 1)`,
        [env.ADMIN_NAME, env.ADMIN_EMAIL.toLowerCase().trim(), env.ADMIN_PHONE, env.ADMIN_ADDRESS, hashedPassword]
      );
      logger.info(`Admin account created successfully for ${env.ADMIN_EMAIL}`);
    } else {
      logger.info(`Admin account already exists (${existingAdmins[0]?.email}). Skipping admin creation.`);
    }

    logger.info('Database seeding completed successfully.');
  } catch (error) {
    logger.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    await closeDatabasePool();
  }
};

if (require.main === module) {
  runSeed().then(() => process.exit(0));
}
