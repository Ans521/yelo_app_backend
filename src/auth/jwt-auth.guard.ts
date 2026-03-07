import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');
import { JWT_SECRET } from '../constants';
import type { JwtPayload } from './auth.types';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      if (!payload.email) {
        throw new UnauthorizedException('Invalid token payload.');
      }
      (request as { user?: { userId?: number; email: string; role: string } }).user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role ?? (payload.userId != null ? 'user' : 'admin'),
      };
      return true;
    } catch (err: any) {
      const msg = err?.message ?? 'Invalid token.';
      if (msg.includes('expired')) {
        throw new UnauthorizedException('Token expired.');
      }
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
