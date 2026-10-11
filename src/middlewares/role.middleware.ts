import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { AppError } from '../utils/appError';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('Access denied. Administrator privileges required'));
    }

    next();
  };
};

export const adminOnly = requireRole(['ADMIN']);
