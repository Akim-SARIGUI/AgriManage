import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType as PrismaType } from '@agrimanage/database';
import {
  NotificationType,
  type NotificationDto,
  type NotificationsFeedDto,
} from '@agrimanage/shared';
import { PrismaService } from '../prisma/prisma.service';

const LOW_STOCK_THRESHOLD = 5;
const HARVEST_DAYS = 14;
const ACTIVITY_DAYS = 7;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: string): Promise<NotificationsFeedDto> {
    await this.refreshReminders(userId);
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
    const unreadCount = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return {
      items: items.map((item) => this.toDto(item)),
      unreadCount,
    };
  }

  async markRead(userId: string, id: string): Promise<NotificationDto> {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Notification introuvable');
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: existing.readAt ?? new Date() },
    });
    return this.toDto(updated);
  }

  async markAllRead(userId: string): Promise<{ success: true }> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async createSupportReplyNotification(params: {
    userId: string | null | undefined;
    ticketId: string;
    ticketName: string;
  }) {
    if (!params.userId) return;
    await this.upsertNotification({
      userId: params.userId,
      type: NotificationType.SUPPORT_REPLY,
      title: 'Réponse du support',
      message: `Votre demande « ${params.ticketName} » a reçu une réponse.`,
      link: '/app/support',
      dedupeKey: `support-reply:${params.ticketId}`,
      reopen: true,
    });
  }

  async refreshReminders(userId: string) {
    const now = new Date();
    const harvestLimit = new Date(now.getTime() + HARVEST_DAYS * 86_400_000);
    const harvestPast = new Date(now.getTime() - HARVEST_DAYS * 86_400_000);
    const activityLimit = new Date(now.getTime() + ACTIVITY_DAYS * 86_400_000);

    await this.upsertNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Bienvenue sur AgriManage',
      message:
        'Vos alertes importantes apparaîtront ici : stock bas, récoltes, activités et réponses support.',
      link: '/app',
      dedupeKey: 'welcome',
    });

    const [stocks, cropsUpcoming, cropsDue, activities, repliedTickets, parcelCount] =
      await Promise.all([
        this.prisma.stock.findMany({
          where: { userId, quantity: { lte: LOW_STOCK_THRESHOLD } },
        }),
        this.prisma.crop.findMany({
          where: {
            parcel: { userId },
            harvestDate: { gte: now, lte: harvestLimit },
          },
          include: { parcel: true },
        }),
        this.prisma.crop.findMany({
          where: {
            parcel: { userId },
            harvestDate: { gte: harvestPast, lt: now },
          },
          include: { parcel: true },
        }),
        this.prisma.activity.findMany({
          where: {
            crop: { parcel: { userId } },
            date: { gte: now, lte: activityLimit },
          },
          include: { crop: true },
        }),
        this.prisma.supportTicket.findMany({
          where: {
            userId,
            response: { not: null },
            respondedAt: { gte: new Date(now.getTime() - 30 * 86_400_000) },
          },
        }),
        this.prisma.parcel.count({ where: { userId } }),
      ]);

    if (parcelCount === 0) {
      await this.upsertNotification({
        userId,
        type: NotificationType.SYSTEM,
        title: 'Commencez par une parcelle',
        message: 'Ajoutez votre première parcelle pour suivre cultures, carte et rapports.',
        link: '/app/parcels',
        dedupeKey: 'onboarding-parcel',
        reopen: true,
      });
    }

    for (const stock of stocks) {
      await this.upsertNotification({
        userId,
        type: NotificationType.LOW_STOCK,
        title: 'Stock bas',
        message: `« ${stock.name} » est bas (${stock.quantity} ${stock.unit}). Pensez à réapprovisionner.`,
        link: `/app/stocks?type=${stock.type}`,
        dedupeKey: `low-stock:${stock.id}`,
        reopen: true,
      });
    }

    for (const crop of cropsUpcoming) {
      const when = crop.harvestDate
        ? new Date(crop.harvestDate).toLocaleDateString('fr-FR')
        : '';
      await this.upsertNotification({
        userId,
        type: NotificationType.HARVEST_REMINDER,
        title: 'Récolte à venir',
        message: `La culture « ${crop.name} » (${crop.parcel.name}) est prévue pour le ${when}.`,
        link: `/app/crops/${crop.id}`,
        dedupeKey: `harvest:${crop.id}`,
        reopen: true,
      });
    }

    for (const crop of cropsDue) {
      const when = crop.harvestDate
        ? new Date(crop.harvestDate).toLocaleDateString('fr-FR')
        : '';
      await this.upsertNotification({
        userId,
        type: NotificationType.HARVEST_REMINDER,
        title: 'Récolte à planifier',
        message: `La récolte de « ${crop.name} » était prévue le ${when}. Vérifiez l’état de la culture.`,
        link: `/app/crops/${crop.id}`,
        dedupeKey: `harvest-due:${crop.id}`,
        reopen: true,
      });
    }

    for (const activity of activities) {
      const when = activity.date
        ? new Date(activity.date).toLocaleDateString('fr-FR')
        : '';
      await this.upsertNotification({
        userId,
        type: NotificationType.ACTIVITY_REMINDER,
        title: 'Rappel d’activité',
        message: `Activité « ${activity.name} » prévue le ${when} pour ${activity.crop.name}.`,
        link: `/app/crops/${activity.cropId}`,
        dedupeKey: `activity:${activity.id}`,
        reopen: true,
      });
    }

    for (const ticket of repliedTickets) {
      await this.upsertNotification({
        userId,
        type: NotificationType.SUPPORT_REPLY,
        title: 'Réponse du support',
        message: `Votre demande « ${ticket.name} » a une réponse de l’équipe.`,
        link: '/app/support',
        dedupeKey: `support-reply:${ticket.id}`,
        reopen: true,
      });
    }
  }

  private async upsertNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    dedupeKey: string;
    reopen?: boolean;
  }) {
    const existing = await this.prisma.notification.findUnique({
      where: {
        userId_dedupeKey: {
          userId: input.userId,
          dedupeKey: input.dedupeKey,
        },
      },
    });

    if (!existing) {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type as PrismaType,
          title: input.title,
          message: input.message,
          link: input.link,
          dedupeKey: input.dedupeKey,
        },
      });
      return;
    }

    await this.prisma.notification.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        message: input.message,
        link: input.link,
        type: input.type as PrismaType,
        ...(input.reopen && existing.readAt
          ? {
              // Keep welcome read; reopen operational alerts if content changed
              ...(input.dedupeKey === 'welcome'
                ? {}
                : existing.message !== input.message
                  ? { readAt: null }
                  : {}),
            }
          : {}),
      },
    });
  }

  private toDto(item: {
    id: string;
    type: PrismaType;
    title: string;
    message: string;
    link: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: item.id,
      type: item.type as NotificationType,
      title: item.title,
      message: item.message,
      link: item.link,
      readAt: item.readAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
