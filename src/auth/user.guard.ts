import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    if (!user || user.role === 'admin') {
      throw new ForbiddenException('User access required.');
    }
    return true;
  }
}

// user guard and admin guard are used to protect routes as kii agr koi route hai jisko admin access kr skta hai but not user so waha admin gaurd lgega or vice vers.