import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [MailModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
