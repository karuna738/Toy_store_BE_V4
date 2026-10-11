import { getPool } from '../../config/database';
import { IOrder, IOrderItem } from '../../types';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';

export interface FormattedOrderResponse {
  id: string;
  orderNumber: string;
  user: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  items: {
    product: string;
    productCode: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  status: string;
  stockDeducted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class OrderRepository {
  public toOrderResponse(order: IOrder, items: IOrderItem[]): FormattedOrderResponse {
    return {
      id: String(order.id),
      orderNumber: order.order_number,
      user: String(order.user_id),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      phone: order.phone,
      address: order.address,
      items: items.map((i) => ({
        product: String(i.product_id || ''),
        productCode: i.product_code,
        name: i.product_name,
        image: i.product_image || '',
        quantity: Number(i.quantity),
        price: Number(i.price)
      })),
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.delivery_charge),
      totalAmount: Number(order.total_amount),
      status: order.status,
      stockDeducted: Boolean(order.stock_deducted),
      createdAt: order.created_at,
      updatedAt: order.updated_at
    };
  }

  public async getNextOrderNumber(connection?: PoolConnection): Promise<string> {
    const conn = connection || getPool();
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT id, order_number FROM orders ORDER BY id DESC LIMIT 1'
    );

    let nextNumber = 1001;
    const latest = rows[0];
    if (latest && typeof latest.order_number === 'string') {
      const match = latest.order_number.match(/\d+/);
      const digits = match?.[0];
      if (digits) {
        nextNumber = Math.max(nextNumber, parseInt(digits, 10) + 1);
      }
    }
    return `ORD-${nextNumber}`;
  }

  public async findUserOrders(userId: number): Promise<FormattedOrderResponse[]> {
    const pool = getPool();
    const [orders] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    if (orders.length === 0) return [];

    const orderIds = (orders as IOrder[]).map((o) => o.id);
    const [items] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM order_items WHERE order_id IN (?) ORDER BY id ASC',
      [orderIds]
    );

    const itemsMap = new Map<number, IOrderItem[]>();
    for (const item of items as IOrderItem[]) {
      const oid = item.order_id!;
      if (!itemsMap.has(oid)) {
        itemsMap.set(oid, []);
      }
      itemsMap.get(oid)?.push(item);
    }

    return (orders as IOrder[]).map((o) =>
      this.toOrderResponse(o, itemsMap.get(o.id) || [])
    );
  }

  public async findAllOrders(): Promise<FormattedOrderResponse[]> {
    const pool = getPool();
    const [orders] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );

    if (orders.length === 0) return [];

    const orderIds = (orders as IOrder[]).map((o) => o.id);
    const [items] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM order_items WHERE order_id IN (?) ORDER BY id ASC',
      [orderIds]
    );

    const itemsMap = new Map<number, IOrderItem[]>();
    for (const item of items as IOrderItem[]) {
      const oid = item.order_id!;
      if (!itemsMap.has(oid)) {
        itemsMap.set(oid, []);
      }
      itemsMap.get(oid)?.push(item);
    }

    return (orders as IOrder[]).map((o) =>
      this.toOrderResponse(o, itemsMap.get(o.id) || [])
    );
  }

  public async findOrderById(
    orderId: number,
    connection?: PoolConnection
  ): Promise<{ order: IOrder; items: IOrderItem[] } | null> {
    const conn = connection || getPool();
    const [orderRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );

    const order = orderRows[0] as IOrder | undefined;
    if (!order) return null;

    const [itemRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC',
      [orderId]
    );

    return { order, items: itemRows as IOrderItem[] };
  }
}

export const orderRepository = new OrderRepository();
