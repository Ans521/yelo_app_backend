import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const OTP_KEY_PREFIX = 'otp:';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') ?? 'localhost';
    const port = parseInt(this.configService.get<string>('REDIS_PORT') ?? '6379', 10);
    this.client = new Redis({ host, port });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async setOtp(email: string, otp: string, ttlSeconds: number): Promise<void> {
    const key = OTP_KEY_PREFIX + email.toLowerCase().trim();
    await this.client.set(key, otp, 'EX', ttlSeconds);
  }

  async getOtp(email: string): Promise<string | null> {
    console.log("getOtp: ", email);
    const key = OTP_KEY_PREFIX + email.toLowerCase().trim();
    console.log("key: ", key);
    console.log("email: ", email);
    return this.client.get(key);
  }

  async deleteOtp(email: string): Promise<void> {
    const key = OTP_KEY_PREFIX + email.toLowerCase().trim();
    await this.client.del(key);
  }
}
