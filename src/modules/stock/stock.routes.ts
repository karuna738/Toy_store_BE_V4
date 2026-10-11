import { Router } from 'express';
import { stockController } from './stock.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { adjustStockSchema, getMovementsQuerySchema } from './stock.schema';

const router = Router();

// Everything under /api/stock is admin-only
router.use(authMiddleware, adminOnly);

router.get('/movements', validateRequest({ query: getMovementsQuerySchema }), stockController.getMovements);
router.get('/low', stockController.getLowStock);
router.post('/adjust', validateRequest({ body: adjustStockSchema }), stockController.adjustStock);

export default router;
