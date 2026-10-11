import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter';
import { registerSchema, loginSchema, updateMeSchema } from './auth.schema';

const router = Router();

router.post('/register', authRateLimiter, validateRequest({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/me', authMiddleware, validateRequest({ body: updateMeSchema }), authController.updateMe);

export default router;
