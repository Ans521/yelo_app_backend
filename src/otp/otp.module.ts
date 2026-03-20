import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [MailModule, AuthModule, FirebaseModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
