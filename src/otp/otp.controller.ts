import { Body, Controller, Post } from '@nestjs/common';
import { GetOtpDto } from './dto/get-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('get-otp')
  async getOtp(@Body() dto: GetOtpDto) {
    console.log("getOtp: ", dto);
    return this.otpService.getOtp(dto.email);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    console.log('[OTP] verify-otp controller hit, body:', { email: dto.email, otp: dto.otp });
    return this.otpService.verifyOtp(dto.email, dto.otp);
  }
}
