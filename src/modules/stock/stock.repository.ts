import { getPool } from '../../config/database';
import { IStockMovement, IProduct, IProductResponse } from '../../types';
import { GetMovementsQuery } from './stock.schema';
import { productRepository } from '../products/product.repository';
import { RowDataPacket } from 'mysql2/promise';

export interface FormattedMovementResponse {
  id: string;
  product: string;
  productCode: string;
  productName: string;
  type: 'IN' | 'OUT';
  previousQty: number;
  changedQty: number;
  newQty: number;
  reason: string;
  order?: string;
  performedByName?: string;
  performedByRole?: string;
  createdAt: string;
}

export class StockRepository {
  public toMovementResponse(m: IStockMovement): FormattedMovementResponse {
    return {
      id: String(m.id),
      product: String(m.product_id || ''),
      productCode: m.product_code,
      productName: m.product_name,
      type: m.type,
      previousQty: Number(m.previous_qty),
      changedQty: Number(m.changed_qty),
      newQty: Number(m.new_qty),
      reason: m.reason,
      ...(m.order_id ? { order: String(m.order_id) } : {}),
      ...(m.performed_by_name ? { performedByName: m.performed_by_name } : {}),
      ...(m.performed_by_role ? { performedByRole: m.performed_by_role } : {}),
      createdAt: m.created_at
    };
  }

  public async getMovements(query: GetMovementsQuery): Promise<FormattedMovementResponse[]> {
    const pool = getPool();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.type) {
      conditions.push('type = ?');
      params.push(query.type);
    }

    if (query.product) {
      conditions.push('product_id = ?');
      params.push(Number(query.product));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(Number(query.limit) || 200, 500);
    params.push(limit);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM stock_movements ${whereClause} ORDER BY created_at DESC, id DESC LIMIT ?`,
      params
    );

    return (rows as IStockMovement[]).map((m) => this.toMovementResponse(m));
  }

  public async getLowStockProducts(limitThreshold: number): Promise<IProductResponse[]> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM products
       WHERE stock <= ? AND section != 'coming-soon' AND is_active = 1
       ORDER BY stock ASC`,
      [limitThreshold]
    );

    const products = rows as IProduct[];
    if (products.length === 0) return [];

    const productIds = products.map((p) => p.id);
    const [imageRows] = await pool.query<RowDataPacket[]>(
      'SELECT product_id, image_url FROM product_images WHERE product_id IN (?) ORDER BY display_order ASC',
      [productIds]
    );

    const imageMap = new Map<number, string[]>();
    for (const img of imageRows) {
      const pid = img.product_id;
      if (!imageMap.has(pid)) {
        imageMap.set(pid, []);
      }
      imageMap.get(pid)?.push(img.image_url);
    }

    return products.map((p) =>
      productRepository.toProductResponse(p, imageMap.get(p.id) || [])
    );
  }
}

export const stockRepository = new StockRepository();
