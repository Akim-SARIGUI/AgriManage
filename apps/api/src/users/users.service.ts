import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role as PrismaRole } from '@agrimanage/database';
import { Role, type AdminUserDto } from '@agrimanage/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin-user.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AdminUserDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.toDto(user));
  }

  async findOne(id: string): Promise<AdminUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return this.toDto(user);
  }

  async create(dto: CreateAdminUserDto): Promise<AdminUserDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        fullName: dto.fullName.trim(),
        passwordHash,
        role: dto.role as PrismaRole,
      },
    });

    return this.toDto(user);
  }

  async update(id: string, dto: UpdateAdminUserDto): Promise<AdminUserDto> {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email.toLowerCase(),
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
        ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.role !== undefined ? { role: dto.role as PrismaRole } : {}),
        ...(dto.password
          ? { passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS) }
          : {}),
      },
    });

    return this.toDto(user);
  }

  async remove(id: string, currentAdminId: string): Promise<{ success: true }> {
    if (id === currentAdminId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (user.role === PrismaRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: PrismaRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException('Impossible de supprimer le dernier administrateur');
      }
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async unlock(id: string): Promise<AdminUserDto> {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
      },
    });
    return this.toDto(user);
  }

  private toDto(user: {
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
      role: user.role as Role,
      loginAttempts: user.loginAttempts,
      lockedUntil: user.lockedUntil?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
