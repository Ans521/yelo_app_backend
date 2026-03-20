import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class GetOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  device_token: string;
}