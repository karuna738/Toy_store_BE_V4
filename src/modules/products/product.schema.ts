import { z } from 'zod';

export const SECTIONS = ['regular', 'trending', 'new', 'handmade', 'bestseller', 'coming-soon'] as const;

export const BADGES: Record<string, string> = {
  regular: '',
  trending: 'TRENDING',
  new: 'NEW ARRIVAL',
  handmade: 'HANDMADE',
  bestseller: 'BEST SELLER',
  'coming-soon': 'COMING SOON'
};

export const createProductSchema = z.object({
  code: z.string().trim().min(1, 'Product code is required').max(50),
  name: z.string().trim().min(1, 'Product name is required').max(150),
  category: z.string().trim().min(1, 'Category is required').max(100),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  oldPrice: z.coerce.number().min(0).optional().nullable(),
  discount: z.coerce.number().min(0).max(99).optional().default(0),
  stock: z.coerce.number().int().min(0, 'Stock must be a whole number (0 or more)').optional().default(0),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  reviews: z.coerce.number().int().min(0).optional().default(0),
  description: z.string().optional().default(''),
  images: z.array(z.string()).optional().default([]),
  section: z.enum(SECTIONS).optional().default('regular'),
  recommendedAge: z.string().optional(),
  brand: z.string().optional(),
  material: z.string().optional(),
  safety: z.string().optional()
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  price: z.coerce.number().min(0).optional(),
  oldPrice: z.coerce.number().min(0).optional().nullable(),
  discount: z.coerce.number().min(0).max(99).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviews: z.coerce.number().int().min(0).optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  section: z.enum(SECTIONS).optional(),
  recommendedAge: z.string().optional(),
  brand: z.string().optional(),
  material: z.string().optional(),
  safety: z.string().optional()
});

export const getProductsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['popular', 'price-low', 'price-high', 'newest', 'rating']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
