import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupportStatus as PrismaStatus } from '@agrimanage/database';
import { SupportStatus, type SupportTicketDto } from '@agrimanage/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTicketDto,
  RespondTicketDto,
  UpdateTicketDto,
} from './dto/ticket.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listMine(userId: string): Promise<SupportTicketDto[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((ticket) => this.toDto(ticket));
  }

  async listAll(status?: SupportStatus): Promise<SupportTicketDto[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: status ? { status: status as PrismaStatus } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((ticket) => this.toDto(ticket));
  }

  async findOneForUser(userId: string, id: string): Promise<SupportTicketDto> {
    const ticket = await this.getTicket(id);
    if (ticket.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette demande');
    }
    return this.toDto(ticket);
  }

  async findOneAdmin(id: string): Promise<SupportTicketDto> {
    const ticket = await this.getTicket(id);
    return this.toDto(ticket);
  }

  async create(
    userId: string,
    email: string,
    fullName: string,
    dto: CreateTicketDto,
  ): Promise<SupportTicketDto> {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        email,
        name: dto.name.trim() || fullName,
        message: dto.message.trim(),
        status: PrismaStatus.OPEN,
      },
    });
    return this.toDto(ticket);
  }

  async updateMine(
    userId: string,
    id: string,
    dto: UpdateTicketDto,
  ): Promise<SupportTicketDto> {
    const ticket = await this.getTicket(id);
    if (ticket.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette demande');
    }
    if (ticket.status !== PrismaStatus.OPEN) {
      throw new BadRequestException('Seules les demandes ouvertes peuvent être modifiées');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.message !== undefined ? { message: dto.message.trim() } : {}),
      },
    });
    return this.toDto(updated);
  }

  async removeMine(userId: string, id: string): Promise<{ success: true }> {
    const ticket = await this.getTicket(id);
    if (ticket.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette demande');
    }
    if (ticket.status !== PrismaStatus.OPEN) {
      throw new BadRequestException('Seules les demandes ouvertes peuvent être supprimées');
    }
    await this.prisma.supportTicket.delete({ where: { id } });
    return { success: true };
  }

  async respond(id: string, dto: RespondTicketDto): Promise<SupportTicketDto> {
    await this.getTicket(id);

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        response: dto.response.trim(),
        respondedAt: new Date(),
        status: (dto.status ?? SupportStatus.CLOSED) as PrismaStatus,
      },
    });

    await this.notificationsService.createSupportReplyNotification({
      userId: updated.userId,
      ticketId: updated.id,
      ticketName: updated.name,
    });

    return this.toDto(updated);
  }

  async updateStatus(id: string, status: SupportStatus): Promise<SupportTicketDto> {
    await this.getTicket(id);
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: { status: status as PrismaStatus },
    });
    return this.toDto(updated);
  }

  async removeAdmin(id: string): Promise<{ success: true }> {
    await this.getTicket(id);
    await this.prisma.supportTicket.delete({ where: { id } });
    return { success: true };
  }

  private async getTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Demande introuvable');
    }
    return ticket;
  }

  private toDto(ticket: {
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
}
