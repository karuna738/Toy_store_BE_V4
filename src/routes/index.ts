import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import productRoutes from '../modules/products/product.routes';
import orderRoutes from '../modules/orders/order.routes';
import stockRoutes from '../modules/stock/stock.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import { checkDatabaseConnection } from '../config/database';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

// Health Check Probe
router.get('/health', async (_req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection();
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  }, 'ToyVerse Backend Service is running');
});

// Module Sub-Routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/stock', stockRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/upload', uploadRoutes);

export default router;
