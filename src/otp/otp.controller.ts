import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { GetOtpDto } from './dto/get-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Public()
  @Post('get-otp')
  async getOtp(@Body() dto: GetOtpDto) {
    return this.otpService.getOtp(dto.email);
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto.email, dto.otp);
  }
}
