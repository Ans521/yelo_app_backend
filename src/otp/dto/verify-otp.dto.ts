import { IsEmail, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @Transform(({ value }) => (value != null ? String(value) : value))
  @IsString()
  @Length(4, 4, { message: 'OTP must be 4 digits' })
  otp: string;
}
