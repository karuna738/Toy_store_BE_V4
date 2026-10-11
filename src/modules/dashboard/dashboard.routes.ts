import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware, adminOnly);

router.get('/', dashboardController.getDashboard);

export default router;
