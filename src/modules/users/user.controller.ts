import { Request, Response, NextFunction } from 'express';
import { userRepository } from './user.repository';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export class UserController {
  public getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await userRepository.findAll();
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest('Invalid user ID'));
      }
      const user = await userRepository.findById(id);
      if (!user) {
        return next(AppError.notFound('User not found'));
      }
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
