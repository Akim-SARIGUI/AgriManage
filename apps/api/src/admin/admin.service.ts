import { Injectable } from '@nestjs/common';
import { Role as PrismaRole, SupportStatus as PrismaStatus } from '@agrimanage/database';
import {
  SupportStatus,
  type AdminOverviewDto,
  type AdminUserDto,
  type SupportTicketDto,
} from '@agrimanage/shared';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from '../health/health.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly healthService: HealthService,
  ) {}

  async getOverview(): Promise<AdminOverviewDto> {
    const now = new Date();
    const [
      totalUsers,
      farmers,
      admins,
      locked,
      totalTickets,
      openTickets,
      inProgressTickets,
      closedTickets,
      recentTicketRows,
      recentUserRows,
      health,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: PrismaRole.USER } }),
      this.prisma.user.count({ where: { role: PrismaRole.ADMIN } }),
      this.prisma.user.count({ where: { lockedUntil: { gt: now } } }),
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: PrismaStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: PrismaStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { status: PrismaStatus.CLOSED } }),
      this.prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.healthService.getStatus(),
    ]);

    return {
      users: {
        total: totalUsers,
        farmers,
        admins,
        locked,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        closed: closedTickets,
      },
      health,
      recentTickets: recentTicketRows.map((ticket) => this.toTicketDto(ticket)),
      recentUsers: recentUserRows.map((user) => this.toUserDto(user)),
    };
  }

  private toTicketDto(ticket: {
    id: string;
    userId: string | null;
    name: string;
    email: string;
    message: string;
    status: PrismaStatus;
    response: string | null;
    respondedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SupportTicketDto {
    return {
      id: ticket.id,
      userId: ticket.userId,
      name: ticket.name,
      email: ticket.email,
      message: ticket.message,
      status: ticket.status as SupportStatus,
      response: ticket.response,
      respondedAt: ticket.respondedAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }

  private toUserDto(user: {
    id: string;
    email: string;
    fullName: string;
    role: PrismaRole;
    loginAttempts: number;
    lockedUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminUserDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as AdminUserDto['role'],
      loginAttempts: user.loginAttempts,
      lockedUntil: user.lockedUntil?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
