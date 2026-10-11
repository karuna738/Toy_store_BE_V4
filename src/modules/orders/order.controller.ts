import { Response, NextFunction } from 'express';
import { orderService } from './order.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import { AppError } from '../../utils/appError';

export class OrderController {
  public createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized());
      }
      const order = await orderService.createOrder(req.body, req.user);
      sendSuccess(res, order, 'Order created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public getMyOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized());
      }
      const orders = await orderService.getMyOrders(req.user.numericId);
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  public cancelMyOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized());
      }
      const orderId = Number(req.params.id);
      if (isNaN(orderId)) {
        return next(AppError.badRequest('Invalid order ID'));
      }
      const order = await orderService.cancelMyOrder(orderId, req.user);
      sendSuccess(res, order, 'Order cancelled', 200);
    } catch (error) {
      next(error);
    }
  };

  public getAllOrders = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orders = await orderService.getAllOrders();
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  public updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = Number(req.params.id);
      if (isNaN(orderId)) {
        return next(AppError.badRequest('Invalid order ID'));
      }
      const order = await orderService.updateOrderStatus(orderId, req.body.status, req.user);
      sendSuccess(res, order, 'Order status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const orderController = new OrderController();
