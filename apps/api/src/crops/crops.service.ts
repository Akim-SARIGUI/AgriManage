import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ActivityDto,
  CropDetailDto,
  CropDto,
  InterventionDto,
} from '@agrimanage/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';

@Injectable()
export class CropsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string, parcelId?: string): Promise<CropDto[]> {
    if (parcelId) {
      await this.assertParcelOwnership(userId, parcelId);
    }

    const crops = await this.prisma.crop.findMany({
      where: {
        parcel: { userId },
        ...(parcelId ? { parcelId } : {}),
      },
      include: { parcel: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return crops.map((crop) => this.toCropDto(crop));
  }

  async findOneForUser(userId: string, id: string): Promise<CropDetailDto> {
    const crop = await this.prisma.crop.findUnique({
      where: { id },
      include: {
        parcel: { select: { userId: true, name: true } },
        activities: {
          include: { interventions: { orderBy: { createdAt: 'desc' } } },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!crop) {
      throw new NotFoundException('Culture introuvable');
    }
    if (crop.parcel.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette culture');
    }

    return {
      ...this.toCropDto(crop),
      activities: crop.activities.map((activity) => this.toActivityDto(activity)),
    };
  }

  async create(userId: string, dto: CreateCropDto): Promise<CropDto> {
    await this.assertParcelOwnership(userId, dto.parcelId);

    const crop = await this.prisma.crop.create({
      data: {
        parcelId: dto.parcelId,
        name: dto.name.trim(),
        plantingDate: dto.plantingDate ? new Date(dto.plantingDate) : null,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : null,
      },
      include: { parcel: { select: { name: true } } },
    });

    return this.toCropDto(crop);
  }

  async update(userId: string, id: string, dto: UpdateCropDto): Promise<CropDto> {
    await this.findOneForUser(userId, id);

    if (dto.parcelId) {
      await this.assertParcelOwnership(userId, dto.parcelId);
    }

    const crop = await this.prisma.crop.update({
      where: { id },
      data: {
        ...(dto.parcelId !== undefined ? { parcelId: dto.parcelId } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.plantingDate !== undefined
          ? { plantingDate: dto.plantingDate ? new Date(dto.plantingDate) : null }
          : {}),
        ...(dto.harvestDate !== undefined
          ? { harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : null }
          : {}),
      },
      include: { parcel: { select: { name: true } } },
    });

    return this.toCropDto(crop);
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    await this.findOneForUser(userId, id);
    await this.prisma.crop.delete({ where: { id } });
    return { success: true };
  }

  async createActivity(
    userId: string,
    cropId: string,
    dto: CreateActivityDto,
  ): Promise<ActivityDto> {
    await this.findOneForUser(userId, cropId);

    const activity = await this.prisma.activity.create({
      data: {
        cropId,
        name: dto.name.trim(),
        date: dto.date ? new Date(dto.date) : null,
        details: dto.details?.trim() || null,
      },
      include: { interventions: true },
    });

    return this.toActivityDto(activity);
  }

  async updateActivity(
    userId: string,
    activityId: string,
    dto: UpdateActivityDto,
  ): Promise<ActivityDto> {
    const activity = await this.getOwnedActivity(userId, activityId);

    const updated = await this.prisma.activity.update({
      where: { id: activity.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.date !== undefined ? { date: dto.date ? new Date(dto.date) : null } : {}),
        ...(dto.details !== undefined
          ? { details: dto.details?.trim() || null }
          : {}),
      },
      include: { interventions: { orderBy: { createdAt: 'desc' } } },
    });

    return this.toActivityDto(updated);
  }

  async removeActivity(userId: string, activityId: string): Promise<{ success: true }> {
    const activity = await this.getOwnedActivity(userId, activityId);
    await this.prisma.activity.delete({ where: { id: activity.id } });
    return { success: true };
  }

  async createIntervention(
    userId: string,
    activityId: string,
    dto: CreateInterventionDto,
  ): Promise<InterventionDto> {
    await this.getOwnedActivity(userId, activityId);

    const intervention = await this.prisma.intervention.create({
      data: {
        activityId,
        note: dto.note?.trim() || null,
      },
    });

    return this.toInterventionDto(intervention);
  }

  async removeIntervention(
    userId: string,
    interventionId: string,
  ): Promise<{ success: true }> {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id: interventionId },
      include: {
        activity: {
          include: {
            crop: { include: { parcel: { select: { userId: true } } } },
          },
        },
      },
    });

    if (!intervention) {
      throw new NotFoundException('Intervention introuvable');
    }
    if (intervention.activity.crop.parcel.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette intervention');
    }

    await this.prisma.intervention.delete({ where: { id: interventionId } });
    return { success: true };
  }

  private async assertParcelOwnership(userId: string, parcelId: string) {
    const parcel = await this.prisma.parcel.findUnique({ where: { id: parcelId } });
    if (!parcel) {
      throw new NotFoundException('Parcelle introuvable');
    }
    if (parcel.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette parcelle');
    }
  }

  private async getOwnedActivity(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        interventions: true,
        crop: { include: { parcel: { select: { userId: true } } } },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activité introuvable');
    }
    if (activity.crop.parcel.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette activité');
    }

    return activity;
  }

  private toCropDto(crop: {
    id: string;
    parcelId: string;
    name: string;
    plantingDate: Date | null;
    harvestDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    parcel?: { name: string };
  }): CropDto {
    return {
      id: crop.id,
      parcelId: crop.parcelId,
      parcelName: crop.parcel?.name,
      name: crop.name,
      plantingDate: crop.plantingDate?.toISOString() ?? null,
      harvestDate: crop.harvestDate?.toISOString() ?? null,
      createdAt: crop.createdAt.toISOString(),
      updatedAt: crop.updatedAt.toISOString(),
    };
  }

  private toActivityDto(activity: {
    id: string;
    cropId: string;
    name: string;
    date: Date | null;
    details: string | null;
    createdAt: Date;
    updatedAt: Date;
    interventions?: Array<{
      id: string;
      activityId: string;
      note: string | null;
      createdAt: Date;
    }>;
  }): ActivityDto {
    return {
      id: activity.id,
      cropId: activity.cropId,
      name: activity.name,
      date: activity.date?.toISOString() ?? null,
      details: activity.details,
      createdAt: activity.createdAt.toISOString(),
      updatedAt: activity.updatedAt.toISOString(),
      interventions: activity.interventions?.map((item) => this.toInterventionDto(item)),
    };
  }

  private toInterventionDto(intervention: {
    id: string;
    activityId: string;
    note: string | null;
    createdAt: Date;
  }): InterventionDto {
    return {
      id: intervention.id,
      activityId: intervention.activityId,
      note: intervention.note,
      createdAt: intervention.createdAt.toISOString(),
    };
  }
}
