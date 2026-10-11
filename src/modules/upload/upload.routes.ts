import { Router } from 'express';
import { uploadController } from './upload.controller';
import { upload } from './upload.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { adminOnly } from '../../middlewares/role.middleware';

const router = Router();

router.post(
  '/',
  authMiddleware,
  adminOnly,
  upload.array('images', 8),
  uploadController.uploadImages
);

export default router;
