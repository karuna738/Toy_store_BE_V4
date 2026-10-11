import { Request } from 'express';

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface IUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  password_hash: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface IPublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  createdAt: string;
}

export interface IJwtPayload {
  id: number;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: IPublicUser & { numericId: number };
}

export type ProductSection = 'regular' | 'trending' | 'new' | 'handmade' | 'bestseller' | 'coming-soon';

export interface IProduct {
  id: number;
  code: string;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  discount: number;
  stock: number;
  rating: number;
  reviews_count: number;
  description: string | null;
  main_image: string;
  section: ProductSection;
  badge: string;
  recommended_age: string | null;
  brand: string | null;
  material: string | null;
  safety: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface IProductResponse {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  discount: number;
  stock: number;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  images: string[];
  section: ProductSection;
  badge: string;
  recommendedAge?: string;
  brand?: string;
  material?: string;
  safety?: string;
  createdAt: string;
}

export type OrderStatus = 'Pending' | 'Dispatched' | 'Delivered' | 'Not Available' | 'Cancelled' | 'Returned';

export interface IOrderItem {
  id?: number;
  order_id?: number;
  product_id: number | null;
  product_code: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  created_at?: string;
}

export interface IOrder {
  id: number;
  order_number: string;
  user_id: number;
  customer_name: string;
  customer_email: string;
  phone: string;
  address: string;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  status: OrderStatus;
  stock_deducted: number;
  created_at: string;
  updated_at: string;
}

export interface IStockMovement {
  id: number;
  product_id: number | null;
  product_code: string;
  product_name: string;
  type: 'IN' | 'OUT';
  previous_qty: number;
  changed_qty: number;
  new_qty: number;
  reason: string;
  order_id: number | null;
  performed_by: number | null;
  performed_by_name: string | null;
  performed_by_role: string | null;
  created_at: string;
}
