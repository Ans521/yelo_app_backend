import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JWT_SECRET } from '../constants';
import type { JwtPayload } from './auth.types';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const secret = this.configService.get<string>('JWT_SECRET') ?? JWT_SECRET;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    if (!payload?.email) {
      throw new UnauthorizedException('Invalid token payload.');
    }
    const pair = this.issueTokenPair({
      userId: payload.userId,
      email: payload.email,
      role: payload.role ?? 'user',
    });
    return pair;
  }

  issueTokenPair(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { accessToken, refreshToken };
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
