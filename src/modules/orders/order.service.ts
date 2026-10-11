import { orderRepository, FormattedOrderResponse } from './order.repository';
import { CreateOrderInput } from './order.schema';
import { IPublicUser, IProduct, OrderStatus } from '../../types';
import { AppError } from '../../utils/appError';
import { withTransaction } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const FREE_DELIVERY_THRESHOLD = 999;
const DELIVERY_FEE = 49;
const RESTOCK_STATUSES: OrderStatus[] = ['Cancelled', 'Not Available', 'Returned'];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Dispatched', 'Delivered', 'Cancelled', 'Not Available'],
  Dispatched: ['Pending', 'Delivered', 'Cancelled', 'Not Available'],
  Delivered: ['Returned'],
  Cancelled: [],
  'Not Available': [],
  Returned: []
};

export class OrderService {
  public async createOrder(
    input: CreateOrderInput,
    user: IPublicUser
  ): Promise<FormattedOrderResponse> {
    const phone = input.phone.trim();
    const address = input.address.trim();

    if (!phone) throw AppError.badRequest('Phone number is required');
    if (!address) throw AppError.badRequest('Delivery address is required');

    // Aggregate wanted quantities per product ID
    const wantedMap = new Map<number, number>();
    for (const item of input.items) {
      const pid = Number(item.product);
      if (isNaN(pid)) {
        throw AppError.badRequest('A product in your cart is no longer available. Please remove it and try again.');
      }
      wantedMap.set(pid, (wantedMap.get(pid) || 0) + item.quantity);
    }

    const productIds = Array.from(wantedMap.keys());
    if (productIds.length === 0) {
      throw AppError.badRequest('Order items are required');
    }

    return withTransaction(async (conn) => {
      // Lock rows for update
      const [productRows] = await conn.query<RowDataPacket[]>(
        'SELECT * FROM products WHERE id IN (?) AND is_active = 1 FOR UPDATE',
        [productIds]
      );

      const products = productRows as IProduct[];
      if (products.length !== productIds.length) {
        throw AppError.badRequest('A product in your cart is no longer available. Please remove it and try again.');
      }

      // Verify availability & stock
      const orderLines: { product: IProduct; quantity: number }[] = [];
      for (const product of products) {
        const qtyWanted = wantedMap.get(product.id);
        if (qtyWanted === undefined) continue;

        if (product.section === 'coming-soon') {
          throw AppError.badRequest(`${product.name} is not available yet`);
        }

        if (product.stock < qtyWanted) {
          throw AppError.badRequest(
            product.stock > 0
              ? `Only ${product.stock} of ${product.name} left in stock`
              : `${product.name} is out of stock`
          );
        }

        orderLines.push({ product, quantity: qtyWanted });
      }

      // Calculate totals
      const subtotal = orderLines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
      const deliveryCharge = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      const totalAmount = subtotal + deliveryCharge;
      const orderNumber = await orderRepository.getNextOrderNumber(conn);

      // Insert master order record
      const [orderResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, phone, address,
          subtotal, delivery_charge, total_amount, status, stock_deducted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 1)`,
        [
          orderNumber,
          Number(user.id),
          user.name,
          user.email,
          phone,
          address,
          subtotal,
          deliveryCharge,
          totalAmount
        ]
      );

      const orderId = orderResult.insertId;

      // Insert order items & deduct inventory
      for (const line of orderLines) {
        const product = line.product;
        const qty = line.quantity;
        const price = Number(product.price);

        await conn.query(
          `INSERT INTO order_items (
            order_id, product_id, product_code, product_name, product_image, quantity, price
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, product.id, product.code, product.name, product.main_image, qty, price]
        );

        // Deduct inventory
        await conn.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [qty, product.id]
        );

        // Audit log in stock_movements
        await conn.query(
          `INSERT INTO stock_movements (
            product_id, product_code, product_name, type, previous_qty, changed_qty,
            new_qty, reason, order_id, performed_by, performed_by_name, performed_by_role
          ) VALUES (?, ?, ?, 'OUT', ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id,
            product.code,
            product.name,
            product.stock,
            qty,
            product.stock - qty,
            `Order ${orderNumber} placed`,
            orderId,
            Number(user.id),
            user.name,
            user.role
          ]
        );
      }

      // Update customer delivery info
      await conn.query(
        'UPDATE users SET phone = ?, address = ? WHERE id = ?',
        [phone, address, Number(user.id)]
      );

      const orderData = await orderRepository.findOrderById(orderId, conn);
      if (!orderData) {
        throw AppError.notFound('Order not found after creation');
      }
      return orderRepository.toOrderResponse(orderData.order, orderData.items);
    });
  }

  public async getMyOrders(userId: number): Promise<FormattedOrderResponse[]> {
    return orderRepository.findUserOrders(userId);
  }

  public async getAllOrders(): Promise<FormattedOrderResponse[]> {
    return orderRepository.findAllOrders();
  }

  public async cancelMyOrder(orderId: number, user: IPublicUser): Promise<FormattedOrderResponse> {
    return withTransaction(async (conn) => {
      const orderData = await orderRepository.findOrderById(orderId, conn);
      if (!orderData || Number(orderData.order.user_id) !== Number(user.id)) {
        throw AppError.notFound('Order not found');
      }

      const order = orderData.order;
      if (order.status !== 'Pending') {
        throw AppError.badRequest(`Only pending orders can be cancelled. This order is ${order.status}.`);
      }

      // Update status
      await conn.query(
        'UPDATE orders SET status = ?, stock_deducted = 0 WHERE id = ?',
        ['Cancelled', orderId]
      );

      // Return units if stock was deducted
      if (order.stock_deducted) {
        for (const item of orderData.items) {
          if (item.product_id) {
            await conn.query(
              'UPDATE products SET stock = stock + ? WHERE id = ?',
              [item.quantity, item.product_id]
            );

            const [pRows] = await conn.query<RowDataPacket[]>(
              'SELECT stock FROM products WHERE id = ? LIMIT 1',
              [item.product_id]
            );
            const firstPRow = pRows[0];
            const currentStock = firstPRow ? Number(firstPRow.stock) : item.quantity;

            await conn.query(
              `INSERT INTO stock_movements (
                product_id, product_code, product_name, type, previous_qty, changed_qty,
                new_qty, reason, order_id, performed_by, performed_by_name, performed_by_role
              ) VALUES (?, ?, ?, 'IN', ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.product_id,
                item.product_code,
                item.product_name,
                currentStock - item.quantity,
                item.quantity,
                currentStock,
                `Order ${order.order_number} cancelled`,
                order.id,
                Number(user.id),
                user.name,
                user.role
              ]
            );
          }
        }
      }

      const updated = await orderRepository.findOrderById(orderId, conn);
      if (!updated) {
        throw AppError.notFound('Order not found after update');
      }
      return orderRepository.toOrderResponse(updated.order, updated.items);
    });
  }

  public async updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus,
    actor?: IPublicUser
  ): Promise<FormattedOrderResponse> {
    return withTransaction(async (conn) => {
      const orderData = await orderRepository.findOrderById(orderId, conn);
      if (!orderData) {
        throw AppError.notFound('Order not found');
      }

      const order = orderData.order;
      if (order.status === newStatus) {
        return orderRepository.toOrderResponse(order, orderData.items);
      }

      const allowed = ALLOWED_TRANSITIONS[order.status] || [];
      if (!allowed.includes(newStatus)) {
        throw AppError.badRequest(`An order that is ${order.status} cannot be changed to ${newStatus}`);
      }

      const restock = RESTOCK_STATUSES.includes(newStatus) && Boolean(order.stock_deducted);

      await conn.query(
        'UPDATE orders SET status = ?, stock_deducted = ? WHERE id = ?',
        [newStatus, restock ? 0 : order.stock_deducted, orderId]
      );

      if (restock) {
        const verb = newStatus === 'Returned' ? 'returned' : newStatus === 'Cancelled' ? 'cancelled' : 'not available';

        for (const item of orderData.items) {
          if (item.product_id) {
            await conn.query(
              'UPDATE products SET stock = stock + ? WHERE id = ?',
              [item.quantity, item.product_id]
            );

            const [pRows] = await conn.query<RowDataPacket[]>(
              'SELECT stock FROM products WHERE id = ? LIMIT 1',
              [item.product_id]
            );
            const firstPRow = pRows[0];
            const currentStock = firstPRow ? Number(firstPRow.stock) : item.quantity;

            await conn.query(
              `INSERT INTO stock_movements (
                product_id, product_code, product_name, type, previous_qty, changed_qty,
                new_qty, reason, order_id, performed_by, performed_by_name, performed_by_role
              ) VALUES (?, ?, ?, 'IN', ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.product_id,
                item.product_code,
                item.product_name,
                currentStock - item.quantity,
                item.quantity,
                currentStock,
                `Order ${order.order_number} ${verb}`,
                order.id,
                actor ? Number(actor.id) : null,
                actor ? actor.name : 'Admin',
                actor ? actor.role : 'ADMIN'
              ]
            );
          }
        }
      }

      const updated = await orderRepository.findOrderById(orderId, conn);
      if (!updated) {
        throw AppError.notFound('Order not found after update');
      }
      return orderRepository.toOrderResponse(updated.order, updated.items);
    });
  }
}

export const orderService = new OrderService();
