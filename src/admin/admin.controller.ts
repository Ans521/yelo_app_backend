import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { Public } from '../auth/public.decorator';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.email, dto.password);
  }
}
