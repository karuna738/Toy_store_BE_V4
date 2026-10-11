import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { env } from '../../config/env';

export class UploadController {
  public uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return next(AppError.badRequest('No image selected for upload'));
      }

      const hostBase = env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
      const urls = files.map((file) => `${hostBase}/uploads/${file.filename}`);

      sendSuccess(res, { urls }, 'Images uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  };
}

export const uploadController = new UploadController();
