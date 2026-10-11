import { getPool } from '../../config/database';
import { IProduct, IProductResponse } from '../../types';
import { GetProductsQuery } from './product.schema';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export class ProductRepository {
  public toProductResponse(product: IProduct, images: string[] = []): IProductResponse {
    const allImages = images.length > 0 ? images : product.main_image ? [product.main_image] : [];
    const firstImg = allImages[0] || '';
    return {
      id: String(product.id),
      code: product.code,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      oldPrice: product.old_price !== null ? Number(product.old_price) : null,
      discount: Number(product.discount),
      stock: Number(product.stock),
      rating: Number(product.rating),
      reviews: Number(product.reviews_count),
      description: product.description || '',
      image: product.main_image || firstImg,
      images: allImages,
      section: product.section,
      badge: product.badge || '',
      recommendedAge: product.recommended_age || undefined,
      brand: product.brand || undefined,
      material: product.material || undefined,
      safety: product.safety || undefined,
      createdAt: product.created_at
    };
  }

  public async findAll(query: GetProductsQuery): Promise<{ products: IProductResponse[]; total: number }> {
    const pool = getPool();
    const conditions: string[] = ['p.is_active = 1'];
    const params: unknown[] = [];

    if (query.search && query.search.trim()) {
      const searchTerm = `%${query.search.trim()}%`;
      conditions.push('(p.name LIKE ? OR p.category LIKE ? OR p.code LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (query.category && query.category.trim()) {
      conditions.push('p.category = ?');
      params.push(query.category.trim());
    }

    if (query.minPrice !== undefined) {
      conditions.push('p.price >= ?');
      params.push(query.minPrice);
    }

    if (query.maxPrice !== undefined) {
      conditions.push('p.price <= ?');
      params.push(query.maxPrice);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count for pagination
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );
    const firstCount = countRows[0];
    const total = Number(firstCount?.total || 0);

    // Sorting
    let orderBy = 'p.created_at DESC';
    switch (query.sort) {
      case 'price-low':
        orderBy = 'p.price ASC';
        break;
      case 'price-high':
        orderBy = 'p.price DESC';
        break;
      case 'rating':
        orderBy = 'p.rating DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'popular':
      default:
        orderBy = 'p.reviews_count DESC, p.rating DESC, p.created_at DESC';
        break;
    }

    let limitClause = '';
    const queryParams = [...params];
    if (query.page !== undefined && query.limit !== undefined) {
      const offset = (query.page - 1) * query.limit;
      limitClause = 'LIMIT ? OFFSET ?';
      queryParams.push(query.limit, offset);
    } else if (query.limit !== undefined) {
      limitClause = 'LIMIT ?';
      queryParams.push(query.limit);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.* FROM products p ${whereClause} ORDER BY ${orderBy} ${limitClause}`,
      queryParams
    );

    const products = rows as IProduct[];
    if (products.length === 0) {
      return { products: [], total };
    }

    // Fetch images for all matched products
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
      const list = imageMap.get(pid);
      if (list) {
        list.push(img.image_url);
      }
    }

    const formatted = products.map((p) =>
      this.toProductResponse(p, imageMap.get(p.id) || [])
    );

    return { products: formatted, total };
  }

  public async findById(id: number): Promise<IProductResponse | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1',
      [id]
    );
    const product = rows[0] as IProduct | undefined;
    if (!product) return null;

    const [imageRows] = await pool.query<RowDataPacket[]>(
      'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order ASC',
      [id]
    );
    const images = (imageRows as { image_url: string }[]).map((img) => img.image_url);

    return this.toProductResponse(product, images);
  }

  public async findByCode(code: string): Promise<IProduct | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE code = ? LIMIT 1',
      [code]
    );
    const product = rows[0] as IProduct | undefined;
    return product || null;
  }

  public async create(
    data: Omit<IProduct, 'id' | 'created_at' | 'updated_at'>,
    images: string[],
    connection?: PoolConnection
  ): Promise<IProductResponse> {
    const conn = connection || getPool();

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO products (
        code, name, category, price, old_price, discount, stock, rating, reviews_count,
        description, main_image, section, badge, recommended_age, brand, material, safety, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        data.code, data.name, data.category, data.price, data.old_price, data.discount,
        data.stock, data.rating, data.reviews_count, data.description, data.main_image,
        data.section, data.badge, data.recommended_age, data.brand, data.material, data.safety
      ]
    );

    const productId = result.insertId;

    if (images.length > 0) {
      const imageValues = images.map((url, index) => [productId, url, index]);
      await conn.query(
        'INSERT INTO product_images (product_id, image_url, display_order) VALUES ?',
        [imageValues]
      );
    }

    const [createdRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [productId]
    );
    const product = createdRows[0] as IProduct | undefined;
    if (!product) {
      throw new Error('Failed to retrieve product after insertion');
    }

    return this.toProductResponse(product, images);
  }

  public async update(
    id: number,
    data: Partial<IProduct>,
    images?: string[],
    connection?: PoolConnection
  ): Promise<IProductResponse | null> {
    const conn = connection || getPool();

    const updateFields: string[] = [];
    const values: unknown[] = [];

    const allowedKeys: (keyof IProduct)[] = [
      'name', 'category', 'price', 'old_price', 'discount', 'stock',
      'rating', 'reviews_count', 'description', 'main_image', 'section',
      'badge', 'recommended_age', 'brand', 'material', 'safety'
    ];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (updateFields.length > 0) {
      values.push(id);
      await conn.query(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
    }

    if (images !== undefined) {
      await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
      if (images.length > 0) {
        const imageValues = images.map((url, index) => [id, url, index]);
        await conn.query(
          'INSERT INTO product_images (product_id, image_url, display_order) VALUES ?',
          [imageValues]
        );
      }
    }

    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [id]
    );
    const product = rows[0] as IProduct | undefined;
    if (!product) return null;

    const [imageRows] = await conn.query<RowDataPacket[]>(
      'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order ASC',
      [id]
    );
    const updatedImages = (imageRows as { image_url: string }[]).map((img) => img.image_url);

    return this.toProductResponse(product, updatedImages);
  }

  public async delete(id: number): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

export const productRepository = new ProductRepository();
