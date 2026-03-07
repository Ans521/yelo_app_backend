import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { JWT_SECRET } from '../constants';
import type { JwtPayload } from './auth.types';

const scryptAsync = promisify(scrypt);
const SALT_LEN = 16;
const KEY_LEN = 64;
const COST = 16384;

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
    const salt = randomBytes(SALT_LEN).toString('hex');
    const key = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
    return `${salt}:${key.toString('hex')}`;
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    const [saltHex, keyHex] = hash.split(':');
    if (!saltHex || !keyHex) return false;
    const key = (await scryptAsync(plain, saltHex, KEY_LEN)) as Buffer;
    const expected = Buffer.from(keyHex, 'hex');
    return key.length === expected.length && timingSafeEqual(key, expected);
  }
}
