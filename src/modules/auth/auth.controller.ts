import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import { AppError } from '../../utils/appError';

export class AuthController {
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized());
      }
      sendSuccess(res, { user: req.user }, undefined, 200);
    } catch (error) {
      next(error);
    }
  };

  public updateMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized());
      }
      const updatedUser = await authService.updateProfile(req.user.numericId, req.body);
      sendSuccess(res, { user: updatedUser }, 'Profile updated', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
