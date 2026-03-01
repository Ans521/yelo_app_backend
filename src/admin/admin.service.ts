import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../constants';

@Injectable()
export class AdminService {
  constructor(private readonly jwtService: JwtService) {}

  login(email: string, password: string): { token: string } {
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new UnauthorizedException('Invalid admin email or password.');
    }
    const token = this.jwtService.sign({
      email: ADMIN_EMAIL,
      role: 'admin',
    });
    return { token };
  }
}
