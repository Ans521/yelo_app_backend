import { BadRequestException } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require('multer');
import { multerUploadOptions } from './core/multer-upload.config';

const uploadImageMulter = multer(multerUploadOptions).single('image');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Run multer for POST /api/upload-image first (before other app.use), so body/headers are untouched
  app.use('/api/upload-image', (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'POST') return next();
    uploadImageMulter(req, res, (err: any) => {
      if (err) return next(err);
      next();
    });
  });
  // Serve uploaded files: use process.cwd() so it works when run from project root (e.g. PM2)
  const uploadPath = join(process.cwd(), 'upload');
  app.useStaticAssets(uploadPath, { prefix: '/upload' });
  // log every request (method, path, client IP) — so we can see if the request reaches the backend
  app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} <- ${ip}`);
    next();
  });
  app.enableCors({
    origin: true, // allow all origins (any port/host)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).filter(Boolean);
        console.log('[Validation] Failed:', messages.length ? messages : errors);
        return new BadRequestException({ message: messages.length ? messages : 'Validation failed' });
      },
    }),
  );
  const port = process.env.PORT ?? 3050;
  await app.listen(port, '0.0.0.0');
  console.log(`Server listening on http://0.0.0.0:${port} (reachable from emulator/device via your machine IP)`);
  console.log('[JWT] Using secret from code (src/constants.ts). Get a new token from POST /otp/verify-otp if you see "invalid signature".');
}
bootstrap();
