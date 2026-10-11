import { Response, NextFunction } from 'express';
import { stockService } from './stock.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';

export class StockController {
  public getMovements = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const movements = await stockService.getMovements(req.query);
      sendSuccess(res, movements);
    } catch (error) {
      next(error);
    }
  };

  public getLowStock = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await stockService.getLowStock();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  public adjustStock = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await stockService.adjustStock(req.body, req.user);
      sendSuccess(res, result, 'Stock updated', 201);
    } catch (error) {
      next(error);
    }
  };
}

export const stockController = new StockController();
