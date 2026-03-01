/**
 * @deprecated Replaced by JwtAuthGuard + UserGuard. Kept for reference.
 * Auth is now handled by src/auth/jwt-auth.guard.ts and role guards.
 */
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');
import { JWT_SECRET } from '../constants';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction) {
    return process.nextTick(next);
  }
}
