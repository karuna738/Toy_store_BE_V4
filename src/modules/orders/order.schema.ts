import { z } from 'zod';

export const ORDER_STATUSES = [
  'Pending',
  'Dispatched',
  'Delivered',
  'Not Available',
  'Cancelled',
  'Returned'
] as const;

export const RESTOCK_STATUSES = ['Cancelled', 'Not Available', 'Returned'] as const;

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      product: z.union([z.string(), z.number()]),
      quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(50, 'Max 50 units per item')
    })
  ).min(1, 'Order must contain at least one item'),
  phone: z.string().trim().min(1, 'Phone number is required').max(30),
  address: z.string().trim().min(1, 'Delivery address is required')
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES)
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
