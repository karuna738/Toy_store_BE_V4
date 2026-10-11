import { getPool } from '../../config/database';
import { env } from '../../config/env';
import { RowDataPacket } from 'mysql2/promise';

export interface DashboardMetrics {
  totalProducts: number;
  availableStock: number;
  lowStockCount: number;
  lowStockLimit: number;
  productsSold: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  averageRating: number;
  productsPerCategory: { label: string; value: number }[];
  ratingBuckets: { label: string; value: number }[];
  soldPerMonth: { label: string; value: number }[];
  revenuePerMonth: { label: string; value: number }[];
}

export class DashboardService {
  private getLast6Months(): { key: string; label: string }[] {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const label = d.toLocaleString('en-US', { month: 'short' });
      months.push({ key: `${year}-${month}`, label });
    }
    return months;
  }

  public async getDashboardMetrics(): Promise<DashboardMetrics> {
    const pool = getPool();
    const limit = env.LOW_STOCK_LIMIT;
    const notSoldStatuses = ['Cancelled', 'Not Available', 'Returned'];

    // 1. Products Aggregations
    const [products] = await pool.query<RowDataPacket[]>(
      'SELECT id, category, price, stock, rating, section FROM products WHERE is_active = 1'
    );

    const totalProducts = products.length;
    const forSale = products.filter((p) => p.section !== 'coming-soon');
    const availableStock = forSale.reduce((sum, p) => sum + Number(p.stock), 0);
    const lowStockCount = forSale.filter((p) => Number(p.stock) <= limit).length;

    const ratedProducts = products.filter((p) => Number(p.rating) > 0);
    const averageRating = ratedProducts.length > 0
      ? Math.round((ratedProducts.reduce((sum, p) => sum + Number(p.rating), 0) / ratedProducts.length) * 10) / 10
      : 0;

    // Categories Breakdown
    const categoryMap = new Map<string, number>();
    for (const p of products) {
      const cat = p.category;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }
    const productsPerCategory = Array.from(categoryMap.entries()).map(([label, value]) => ({
      label,
      value
    }));

    // Rating Buckets (5, 4, 3, 2, 1 stars)
    const ratingBuckets = [5, 4, 3, 2, 1].map((star) => ({
      label: `${star} Star`,
      value: ratedProducts.filter((p) => Math.round(Number(p.rating)) === star).length
    }));

    // 2. Orders Aggregations
    const [orders] = await pool.query<RowDataPacket[]>(
      'SELECT id, status, total_amount, created_at FROM orders'
    );

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'Pending').length;

    const keptOrders = orders.filter((o) => !notSoldStatuses.includes(o.status));
    const totalRevenue = keptOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    // Units sold from order items for kept orders
    let productsSold = 0;
    const keptOrderIds = keptOrders.map((o) => o.id);

    // Monthly Trends (last 6 months)
    const months = this.getLast6Months();
    const monthlyUnitsMap = new Map<string, number>();
    const monthlyRevenueMap = new Map<string, number>();
    for (const m of months) {
      monthlyUnitsMap.set(m.key, 0);
      monthlyRevenueMap.set(m.key, 0);
    }

    for (const order of keptOrders) {
      const orderDate = new Date(order.created_at);
      const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevenueMap.has(key)) {
        monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + Number(order.total_amount));
      }
    }

    if (keptOrderIds.length > 0) {
      const [orderItems] = await pool.query<RowDataPacket[]>(
        `SELECT oi.order_id, oi.quantity, o.created_at
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.order_id IN (?)`,
        [keptOrderIds]
      );

      for (const item of orderItems) {
        const qty = Number(item.quantity);
        productsSold += qty;

        const itemDate = new Date(item.created_at);
        const key = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyUnitsMap.has(key)) {
          monthlyUnitsMap.set(key, (monthlyUnitsMap.get(key) || 0) + qty);
        }
      }
    }

    const soldPerMonth = months.map((m) => ({
      label: m.label,
      value: monthlyUnitsMap.get(m.key) || 0
    }));

    const revenuePerMonth = months.map((m) => ({
      label: m.label,
      value: monthlyRevenueMap.get(m.key) || 0
    }));

    return {
      totalProducts,
      availableStock,
      lowStockCount,
      lowStockLimit: limit,
      productsSold,
      totalOrders,
      totalRevenue,
      pendingOrders,
      averageRating,
      productsPerCategory,
      ratingBuckets,
      soldPerMonth,
      revenuePerMonth
    };
  }
}

export const dashboardService = new DashboardService();
