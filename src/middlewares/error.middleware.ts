import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface MysqlError extends Error {
  code?: string;
  errno?: number;
  sqlMessage?: string;
}

export const errorHandler = (
  err: Error | AppError | MysqlError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response => {
  logger.error(`[${req.method}] ${req.url} - Error:`, err);

  // Operational AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // MySQL Duplicate Entry Error
  const mysqlErr = err as MysqlError;
  if (mysqlErr.code === 'ER_DUP_ENTRY' || mysqlErr.errno === 1062) {
    let duplicateMessage = 'A record with that unique identifier already exists';
    if (mysqlErr.sqlMessage?.includes('uq_users_email')) {
      duplicateMessage = 'Email is already registered';
    } else if (mysqlErr.sqlMessage?.includes('uq_products_code')) {
      duplicateMessage = 'That Product ID is already used';
    } else if (mysqlErr.sqlMessage?.includes('uq_orders_order_number')) {
      duplicateMessage = 'Order number conflict. Please try again';
    }
    return sendError(res, duplicateMessage, 409);
  }

  // MySQL Foreign Key Constraint Error
  if (mysqlErr.code === 'ER_NO_REFERENCED_ROW_2' || mysqlErr.errno === 1452) {
    return sendError(res, 'Invalid reference: related entity does not exist', 400);
  }

  // Unhandled / Unexpected Errors
  const statusCode = 500;
  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal server error';

  return sendError(res, message, statusCode);
};
