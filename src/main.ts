import { BadRequestException } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // log every request (method, path, client IP) — so you can see if the phone request reaches the backend
  app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} <- ${ip}`);
    if (req.url?.includes('verify-otp') && req.method === 'POST') {
      console.log('[OTP] verify-otp raw path:', req.url, '— backend expects /otp/verify-otp');
    }
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
}
bootstrap();
