import { Router } from 'express';
import { productController } from './product.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema, getProductsQuerySchema } from './product.schema';

const router = Router();

// Public routes
router.get('/', validateRequest({ query: getProductsQuerySchema }), productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin-protected routes
router.post(
  '/',
  authMiddleware,
  adminOnly,
  validateRequest({ body: createProductSchema }),
  productController.createProduct
);

router.put(
  '/:id',
  authMiddleware,
  adminOnly,
  validateRequest({ body: updateProductSchema }),
  productController.updateProduct
);

router.delete(
  '/:id',
  authMiddleware,
  adminOnly,
  productController.deleteProduct
);

export default router;
