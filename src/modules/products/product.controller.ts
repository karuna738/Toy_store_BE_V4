import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import { AppError } from '../../utils/appError';

export class ProductController {
  public getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await productService.getProducts(req.query);
      if (req.query.page !== undefined && req.query.limit !== undefined) {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        sendSuccess(res, result.products, undefined, 200, {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        });
      } else {
        sendSuccess(res, result.products, undefined, 200);
      }
    } catch (error) {
      next(error);
    }
  };

  public getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest('Invalid product ID'));
      }
      const product = await productService.getProductById(id);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  };

  public createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await productService.createProduct(req.body, req.user);
      sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest('Invalid product ID'));
      }
      const product = await productService.updateProduct(id, req.body, req.user);
      sendSuccess(res, product, 'Product updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest('Invalid product ID'));
      }
      await productService.deleteProduct(id);
      sendSuccess(res, undefined, 'Product deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const productController = new ProductController();
