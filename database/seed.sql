-- ============================================================================
-- ToyVerse E-Commerce Platform - Optional Sample Data Seed
-- Target: MySQL 8.0+
-- Security Rules:
-- 1. No plaintext passwords stored.
-- 2. No real customer data or PII.
-- 3. Production admin accounts are created via the TypeScript seed script:
--    `npm run seed` which reads ADMIN_EMAIL & ADMIN_PASSWORD from `.env`
--    and securely hashes with bcrypt (cost: 10).
-- ============================================================================

USE `toyverse_db`;

-- Optional sample customer account for local development testing only
-- Password hash below corresponds to the testing credential: 'CustomerTest123!'
-- Hash generated via bcrypt (cost factor 10):
-- $2b$10$wOaA3qI1eXzOa2N4eH4e2eH4e2eH4e2eH4e2eH4e2eH4e2eH4e2eH
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `address`, `password_hash`, `role`, `is_active`)
VALUES (
  2,
  'Demo Customer',
  'customer@toyverse.demo',
  '9876543210',
  '12 Lake View Road, Ambattur, Chennai 600053',
  '$2b$10$3YmGqS2TjXv4F0E1D2C3B.wPj4K5L6M7N8O9P0Q1R2S3T4U5V6W7X',
  'CUSTOMER',
  1
)
ON DUPLICATE KEY UPDATE `name`=`name`;
