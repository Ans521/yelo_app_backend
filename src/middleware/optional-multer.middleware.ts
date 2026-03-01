import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require('multer');
import { multerUploadOptions } from '../core/multer-upload.config';

/**
 * Runs Multer only when Content-Type is multipart/form-data.
 * Accepts both "business_images" and "gallery" as file fields (client may send either name).
 */
const multerHandler = multer(multerUploadOptions).fields([
  { name: 'business_images', maxCount: 100 },
  { name: 'gallery', maxCount: 100 },
]);

/**
 * Single-file multer handler for the "image" field.
 */
const singleImageHandler = multer(multerUploadOptions).single('image');

@Injectable()
export class OptionalMulterMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const contentType = req.headers['content-type'] ?? '';
    if (contentType.includes('multipart/form-data')) {
      multerHandler(req, res, (err: any) => {
        if (err) return next(err);
        next();
      });
    } else {
      (req as any).files = { business_images: [], gallery: [] };
      next();
    }
  }
}

@Injectable()
export class SingleImageMulterMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const contentType = (req.headers['content-type'] ?? '').toLowerCase();
    const isMultipart = contentType.includes('multipart/form-data');
    if (isMultipart) {
      singleImageHandler(req, res, (err: any) => {
        if (err) {
          console.error('[SingleImageMulter] multer error:', err?.message ?? err);
          return next(err);
        }
        next();
      });
    } else {
      console.warn('[SingleImageMulter] skipped (not multipart). Content-Type:', contentType || '(empty)');
      next();
    }
  }
}
