import { productRepository } from './product.repository';
import { CreateProductInput, UpdateProductInput, BADGES } from './product.schema';
import { IProduct, IProductResponse, IPublicUser } from '../../types';
import { AppError } from '../../utils/appError';
import { withTransaction, getPool } from '../../config/database';
import { RowDataPacket } from 'mysql2/promise';

export class ProductService {
  private normalizeProductData(
    input: Partial<CreateProductInput>,
    existing?: IProduct
  ): { data: Partial<IProduct>; images: string[] } {
    const images = input.images !== undefined
      ? input.images.filter((u) => typeof u === 'string' && u.trim().length > 0)
      : [];

    const section = input.section || existing?.section || 'regular';
    const badge = BADGES[section] || '';

    // Calculate discount and pricing
    const currentPrice = input.price !== undefined ? input.price : (existing ? Number(existing.price) : 0);
    const rawOldPrice = input.oldPrice !== undefined
      ? input.oldPrice
      : (existing && existing.old_price !== null ? Number(existing.old_price) : null);
    const discount = input.discount !== undefined
      ? Number(input.discount)
      : (existing ? Number(existing.discount) : 0);

    let finalPrice = currentPrice;
    let finalOldPrice = rawOldPrice;

    if (discount > 0) {
      const original = (rawOldPrice && rawOldPrice > 0) ? rawOldPrice : currentPrice;
      finalOldPrice = original;
      finalPrice = Math.round(original * (1 - discount / 100));
    } else {
      finalOldPrice = null;
    }

    const data: Partial<IProduct> = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      price: finalPrice,
      old_price: finalOldPrice,
      discount,
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.reviews !== undefined ? { reviews_count: input.reviews } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      main_image: images.length > 0 ? images[0] : (existing ? existing.main_image : ''),
      section,
      badge,
      ...(input.recommendedAge !== undefined ? { recommended_age: input.recommendedAge } : {}),
      ...(input.brand !== undefined ? { brand: input.brand } : {}),
      ...(input.material !== undefined ? { material: input.material } : {}),
      ...(input.safety !== undefined ? { safety: input.safety } : {})
    };

    return { data, images };
  }

  public async getProducts(query: unknown): Promise<{ products: IProductResponse[]; total: number }> {
    return productRepository.findAll(query as Parameters<typeof productRepository.findAll>[0]);
  }

  public async getProductById(id: number): Promise<IProductResponse> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.notFound('Product not found');
    }
    return product;
  }

  public async createProduct(
    input: CreateProductInput,
    actor?: IPublicUser
  ): Promise<IProductResponse> {
    const existing = await productRepository.findByCode(input.code);
    if (existing) {
      throw AppError.conflict('That Product ID is already used');
    }

    const { data, images } = this.normalizeProductData(input);
    const productPayload = {
      code: input.code,
      name: input.name,
      category: input.category,
      price: data.price ?? input.price,
      old_price: data.old_price ?? null,
      discount: data.discount ?? 0,
      stock: data.stock ?? input.stock,
      rating: data.rating ?? 0,
      reviews_count: data.reviews_count ?? 0,
      description: data.description ?? '',
      main_image: data.main_image ?? '',
      section: data.section ?? 'regular',
      badge: data.badge ?? '',
      recommended_age: data.recommended_age ?? null,
      brand: data.brand ?? null,
      material: data.material ?? null,
      safety: data.safety ?? null,
      is_active: 1
    };

    return withTransaction(async (conn) => {
      const created = await productRepository.create(productPayload, images, conn);

      if (created.stock > 0) {
        await conn.query(
          `INSERT INTO stock_movements (
            product_id, product_code, product_name, type, previous_qty, changed_qty,
            new_qty, reason, performed_by, performed_by_name, performed_by_role
          ) VALUES (?, ?, ?, 'IN', 0, ?, ?, 'Initial stock (product added)', ?, ?, ?)`,
          [
            Number(created.id),
            created.code,
            created.name,
            created.stock,
            created.stock,
            actor ? Number(actor.id) : null,
            actor ? actor.name : 'Admin',
            actor ? actor.role : 'ADMIN'
          ]
        );
      }

      return created;
    });
  }

  public async updateProduct(
    id: number,
    input: UpdateProductInput,
    actor?: IPublicUser
  ): Promise<IProductResponse> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [id]
    );
    const existing = rows[0] as IProduct | undefined;
    if (!existing) {
      throw AppError.notFound('Product not found');
    }

    const { data, images } = this.normalizeProductData(input, existing);
    const oldStock = Number(existing.stock);
    const newStock = input.stock !== undefined ? Number(input.stock) : oldStock;
    const delta = newStock - oldStock;

    return withTransaction(async (conn) => {
      const updated = await productRepository.update(
        id,
        data,
        input.images !== undefined ? images : undefined,
        conn
      );

      if (!updated) {
        throw AppError.notFound('Product not found');
      }

      if (delta !== 0) {
        await conn.query(
          `INSERT INTO stock_movements (
            product_id, product_code, product_name, type, previous_qty, changed_qty,
            new_qty, reason, performed_by, performed_by_name, performed_by_role
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Manual stock edit (product updated)', ?, ?, ?)`,
          [
            id,
            updated.code,
            updated.name,
            delta > 0 ? 'IN' : 'OUT',
            oldStock,
            Math.abs(delta),
            newStock,
            actor ? Number(actor.id) : null,
            actor ? actor.name : 'Admin',
            actor ? actor.role : 'ADMIN'
          ]
        );
      }

      return updated;
    });
  }

  public async deleteProduct(id: number): Promise<void> {
    const deleted = await productRepository.delete(id);
    if (!deleted) {
      throw AppError.notFound('Product not found');
    }
  }
}

export const productService = new ProductService();
