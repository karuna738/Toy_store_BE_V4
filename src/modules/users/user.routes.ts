import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';

const router = Router();

// Admin-only endpoints
router.use(authMiddleware, adminOnly);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

export default router;
