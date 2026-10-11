import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/appError';

interface SchemaMap {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validateRequest = (schemas: SchemaMap) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationIssues = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        const firstMessage = validationIssues[0]?.message || 'Validation failed';
        return next(new AppError(firstMessage, 400, validationIssues));
      }
      next(error);
    }
  };
};
