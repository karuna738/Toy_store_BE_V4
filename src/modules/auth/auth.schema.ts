import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  phone: z.string().trim().min(7, 'Phone number must be at least 7 digits').max(30),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().trim().optional().default('')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().min(7, 'Phone number must be at least 7 digits').max(30).optional(),
  address: z.string().trim().optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
