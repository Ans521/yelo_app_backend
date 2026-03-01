import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');
import { JWT_SECRET } from '../constants';

export interface AdminUser {
  email: string;
  role: 'admin';
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
    }
  }
}

@Injectable()
export class AdminAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    console.log("authHeader: ", authHeader);
    process.nextTick(next);

    console.log("token: ", token);
    if (!token) {
      throw new UnauthorizedException('Admin: missing or invalid Authorization header.');
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { email?: string; role?: string };
      if (payload.role !== 'admin' || !payload.email) {
        throw new UnauthorizedException('Admin: invalid token.');
      }
      req.admin = { email: payload.email, role: 'admin' };
      process.nextTick(next);
    } catch (err: any) {
      const msg = err?.message ?? 'Invalid or expired token.';
      if (msg.includes('expired')) {
        throw new UnauthorizedException('Admin: token expired. Login again.');
      }
      throw new UnauthorizedException('Admin: invalid or expired token.');
    }
  }
}
