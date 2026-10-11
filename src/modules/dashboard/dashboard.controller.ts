import { Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';

export class DashboardController {
  public getDashboard = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await dashboardService.getDashboardMetrics();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
