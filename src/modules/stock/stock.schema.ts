import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be a whole number of 1 or more'),
  reason: z.string().trim().min(1, 'Please give a reason for the stock adjustment')
});

export const getMovementsQuerySchema = z.object({
  type: z.enum(['IN', 'OUT']).optional(),
  product: z.union([z.string(), z.number()]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type GetMovementsQuery = z.infer<typeof getMovementsQuerySchema>;
