import { Router } from 'express';
import { orderController } from './order.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema } from './order.schema';

const router = Router();

// Customer routes
router.post('/', authMiddleware, validateRequest({ body: createOrderSchema }), orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getMyOrders);
router.put('/:id/cancel', authMiddleware, orderController.cancelMyOrder);

// Admin routes
router.get('/', authMiddleware, adminOnly, orderController.getAllOrders);
router.put(
  '/:id/status',
  authMiddleware,
  adminOnly,
  validateRequest({ body: updateOrderStatusSchema }),
  orderController.updateOrderStatus
);

export default router;
