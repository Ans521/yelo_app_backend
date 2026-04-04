import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getOtpEmailTemplate } from './templates/otp-email.template';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private hasAuth: boolean;

  constructor(private configService: ConfigService) {
    const user = this.configService.get<string>('MAIL_USER') ?? 'mherpsolutions@gmail.com';
    const pass = this.configService.get<string>('MAIL_PASS') ?? 'mlmt jgas gfwt yqoz';
    this.hasAuth = !!pass;
   
    if (this.hasAuth) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST') ?? 'smtp.gmail.com',
        port: parseInt(this.configService.get<string>('MAIL_PORT') ?? '587', 10),
        secure: false,
        auth: { user, pass },
      });
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    if (!this.hasAuth || !this.transporter) {
      // Dev fallback: no MAIL_PASS set — log OTP to console so you can test verify-otp
      return;
    }

    const html = getOtpEmailTemplate(otp);
    const from: string =
      this.configService.get<string>('MAIL_FROM') ??
      this.configService.get<string>('MAIL_USER') ??
      'mherpsolutions@gmail.com';
    await this.transporter.sendMail({
      from,
      to,
      subject: 'Your OTP - My नारायणगढ़',
      html,
    });
  }
}
