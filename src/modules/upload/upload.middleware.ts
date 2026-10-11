import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AppError } from '../../utils/appError';

export const uploadDir = path.resolve(process.cwd(), 'uploads');

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = EXTENSIONS[file.mimetype] || path.extname(file.originalname) || '.jpg';
    const randomHex = crypto.randomBytes(12).toString('hex');
    cb(null, `${randomHex}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per file
    files: 8
  },
  fileFilter: (_req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) {
      cb(null, true);
    } else {
      cb(AppError.badRequest('Only JPG, PNG, WEBP or GIF images are allowed'));
    }
  }
});
