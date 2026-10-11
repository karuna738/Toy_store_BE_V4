import { stockRepository, FormattedMovementResponse } from './stock.repository';
import { AdjustStockInput, GetMovementsQuery } from './stock.schema';
import { IPublicUser, IProduct, IProductResponse } from '../../types';
import { AppError } from '../../utils/appError';
import { env } from '../../config/env';
import { withTransaction } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class StockService {
  public async getMovements(query: GetMovementsQuery): Promise<FormattedMovementResponse[]> {
    return stockRepository.getMovements(query);
  }

  public async getLowStock(): Promise<{ limit: number; products: IProductResponse[] }> {
    const limit = env.LOW_STOCK_LIMIT;
    const products = await stockRepository.getLowStockProducts(limit);
    return { limit, products };
  }

  public async adjustStock(
    input: AdjustStockInput,
    actor?: IPublicUser
  ): Promise<{ movement: FormattedMovementResponse; product: { id: string; stock: number } }> {
    const productId = Number(input.productId);
    if (isNaN(productId)) {
      throw AppError.badRequest('Please choose a valid product');
    }

    const qty = Number(input.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      throw AppError.badRequest('Quantity must be a whole number of 1 or more');
    }

    const reason = input.reason.trim();
    if (!reason) {
      throw AppError.badRequest('Please give a reason');
    }

    return withTransaction(async (conn) => {
      // Lock product row
      const [rows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );

      const product = rows[0] as IProduct | undefined;
      if (!product) {
        throw AppError.notFound('Product not found');
      }

      const currentStock = Number(product.stock);
      if (input.type === 'OUT' && currentStock < qty) {
        throw AppError.badRequest(`Cannot remove ${qty}: only ${currentStock} in stock`);
      }

      const newStock = input.type === 'IN' ? currentStock + qty : currentStock - qty;

      // Update product stock
      await conn.query(
        'UPDATE products SET stock = ? WHERE id = ?',
        [newStock, productId]
      );

      // Insert audit record
      const [movementResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO stock_movements (
          product_id, product_code, product_name, type, previous_qty, changed_qty,
          new_qty, reason, performed_by, performed_by_name, performed_by_role
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.code,
          product.name,
          input.type,
          currentStock,
          qty,
          newStock,
          reason,
          actor ? Number(actor.id) : null,
          actor ? actor.name : 'Admin',
          actor ? actor.role : 'ADMIN'
        ]
      );

      const formattedMovement: FormattedMovementResponse = {
        id: String(movementResult.insertId),
        product: String(product.id),
        productCode: product.code,
        productName: product.name,
        type: input.type,
        previousQty: currentStock,
        changedQty: qty,
        newQty: newStock,
        reason,
        performedByName: actor ? actor.name : 'Admin',
        performedByRole: actor ? actor.role : 'ADMIN',
        createdAt: new Date().toISOString()
      };

      return {
        movement: formattedMovement,
        product: { id: String(product.id), stock: newStock }
      };
    });
  }
}

export const stockService = new StockService();
