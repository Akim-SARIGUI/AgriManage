import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@agrimanage/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { HealthService } from '../health/health.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly healthService: HealthService,
  ) {}

  @Get('overview')
  overview() {
    return this.adminService.getOverview();
  }

  @Get('system/health')
  systemHealth() {
    return this.healthService.getStatus();
  }
}
