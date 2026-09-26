import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ParcelDto } from '@agrimanage/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';

@Injectable()
export class ParcelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string): Promise<ParcelDto[]> {
    const parcels = await this.prisma.parcel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return parcels.map((parcel) => this.toDto(parcel));
  }

  async findOneForUser(userId: string, id: string): Promise<ParcelDto> {
    const parcel = await this.prisma.parcel.findUnique({ where: { id } });
    if (!parcel) {
      throw new NotFoundException('Parcelle introuvable');
    }
    if (parcel.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette parcelle');
    }
    return this.toDto(parcel);
  }

  async create(userId: string, dto: CreateParcelDto): Promise<ParcelDto> {
    const parcel = await this.prisma.parcel.create({
      data: {
        userId,
        name: dto.name.trim(),
        size: dto.size ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        locationLabel: dto.locationLabel?.trim() || null,
      },
    });
    return this.toDto(parcel);
  }

  async update(userId: string, id: string, dto: UpdateParcelDto): Promise<ParcelDto> {
    await this.findOneForUser(userId, id);

    const parcel = await this.prisma.parcel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.size !== undefined ? { size: dto.size } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.locationLabel !== undefined
          ? { locationLabel: dto.locationLabel?.trim() || null }
          : {}),
      },
    });

    return this.toDto(parcel);
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    await this.findOneForUser(userId, id);
    await this.prisma.parcel.delete({ where: { id } });
    return { success: true };
  }

  private toDto(parcel: {
    id: string;
    userId: string;
    name: string;
    size: number | null;
    latitude: number | null;
    longitude: number | null;
    locationLabel: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ParcelDto {
    return {
      id: parcel.id,
      userId: parcel.userId,
      name: parcel.name,
      size: parcel.size,
      latitude: parcel.latitude,
      longitude: parcel.longitude,
      locationLabel: parcel.locationLabel,
      createdAt: parcel.createdAt.toISOString(),
      updatedAt: parcel.updatedAt.toISOString(),
    };
  }
}
