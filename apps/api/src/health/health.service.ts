import { Injectable } from '@nestjs/common';
import type { HealthStatus } from '@agrimanage/shared';
import { APP_NAME } from '@agrimanage/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<HealthStatus> {
    let status: HealthStatus['status'] = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      status = 'degraded';
    }

    return {
      status,
      service: APP_NAME,
      timestamp: new Date().toISOString(),
    };
  }
}
