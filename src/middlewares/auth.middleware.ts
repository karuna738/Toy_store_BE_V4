import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { getPool } from '../config/database';
import { AppError } from '../utils/appError';
import { AuthenticatedRequest, IJwtPayload, IUser } from '../types';
import { RowDataPacket } from 'mysql2/promise';

export const authMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(AppError.unauthorized('No authorization token provided'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(AppError.unauthorized('Authorization token is missing'));
    }

    let decoded: IJwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as IJwtPayload;
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        return next(AppError.unauthorized('Token expired, please log in again'));
      }
      return next(AppError.unauthorized('Invalid authorization token'));
    }

    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, email, phone, address, role, is_active, created_at FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    const user = rows[0] as IUser | undefined;
    if (!user || !user.is_active) {
      return next(AppError.unauthorized('User not found or account deactivated'));
    }

    req.user = {
      id: String(user.id),
      numericId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address || '',
      role: user.role,
      createdAt: user.created_at
    };

    next();
  } catch (error) {
    next(error);
  }
};
