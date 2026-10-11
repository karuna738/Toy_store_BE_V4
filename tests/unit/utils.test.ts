import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../../src/utils/password';
import { AppError } from '../../src/utils/appError';

describe('Unit Tests: Utils', () => {
  describe('Password Hashing & Verification', () => {
    it('should hash a plaintext password and verify correctly', async () => {
      const plaintext = 'SecretToyStorePassword123!';
      const hash = await hashPassword(plaintext);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(plaintext);
      expect(hash.startsWith('$2b$10$')).toBe(true);

      const isValid = await comparePassword(plaintext, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('AppError Custom Error Class', () => {
    it('should create AppError with status code and operational flag', () => {
      const error = AppError.badRequest('Invalid input');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.isOperational).toBe(true);
    });

    it('should create 401 unauthorized and 404 not found errors', () => {
      const unauthorized = AppError.unauthorized();
      expect(unauthorized.statusCode).toBe(401);

      const notFound = AppError.notFound('Product missing');
      expect(notFound.statusCode).toBe(404);
      expect(notFound.message).toBe('Product missing');
    });
  });
});
