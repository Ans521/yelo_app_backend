import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';

const OTP_LENGTH = 4;
const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes

@Injectable()
export class OtpService {
  constructor(
    private readonly mailService: MailService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
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

  async getOtp(email: string): Promise<{ message: string }> {
    console.log(`[OTP] get-otp request received for email: ${email}`);
    const otp = this.generateOtp();
    await this.redis.setOtp(email, otp, OTP_EXPIRY_SECONDS);
    await this.mailService.sendOtpEmail(email, otp);
    return { message: 'OTP sent to your email' };
  }

  async verifyOtp(email: string, otp: string): Promise<{ message: string; verified: boolean }> {
    console.log(`[OTP] verify-otp request received for email: ${email}`);
    const storedOtp = await this.redis.getOtp(email);
    console.log("storedOtp: ", storedOtp);
    console.log(`[OTP] stored OTP for ${email}:`, storedOtp ? 'present' : 'missing');
    if (!storedOtp) {
      throw new BadRequestException('No OTP found for this email. Please request a new one.');
    }
    if (storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP.');
    }
    await this.redis.deleteOtp(email);
    return { message: 'Email verified successfully', verified: true };
  }
}
