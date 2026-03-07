import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../auth/auth.service';

const OTP_LENGTH = 4;
const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes

@Injectable()
export class OtpService {
  constructor(
    private readonly mailService: MailService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
    private readonly authService: AuthService,
  ) {}

  private generateOtp(): string {
    // for testing: set TEST_OTP=1111 in .env to use fixed OTP for all emails
    const testOtp = this.configService.get<string>('TEST_OTP');
    if (testOtp != null && testOtp !== '') {
      return testOtp;
    }
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  async getOtp(email: string): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const otp = this.generateOtp();
    await this.redis.setOtp(email, otp, OTP_EXPIRY_SECONDS);
    await this.mailService.sendOtpEmail(email, otp);
    const existingUser: { id: number }[] = await this.db.query('SELECT id FROM users WHERE email = ?', [email]);
    let userId: number;
    if (existingUser && existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      const result: { insertId?: number } = await this.db.query(
        'INSERT INTO users (email) VALUES (?)',
        [email],
      );
      userId = result?.insertId as number;
    }
    const { accessToken, refreshToken } = this.authService.issueTokenPair({
      userId,
      email,
      role: 'user'
    });
    return { message: 'OTP sent to your email', accessToken, refreshToken };
  }

  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ message: string; verified: boolean;}> {
    const storedOtp = await this.redis.getOtp(email);
    if (!storedOtp) {
      throw new BadRequestException('No OTP found for this email. Please request a new one.');
    }
    if (storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP.');
    }
    await this.redis.deleteOtp(email);
    const users: { id: number; email: string }[] = await this.db.query(
      'SELECT id, email FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    const user = users?.[0];
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    return { message: 'Email verified successfully', verified: true };
  }
}
