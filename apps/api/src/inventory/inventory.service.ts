import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  StockMovementLevel as PrismaLevel,
  StockType as PrismaStockType,
} from '@agrimanage/database';
import {
  StockMovementLevel,
  StockType,
  type StockDto,
  type StockHistoryDto,
} from '@agrimanage/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { MoveStockDto } from './dto/move-stock.dto';

export const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, type?: StockType): Promise<StockDto[]> {
    const stocks = await this.prisma.stock.findMany({
      where: {
        userId,
        ...(type ? { type: type as PrismaStockType } : {}),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return stocks.map((stock) => this.toStockDto(stock));
  }

  async findOne(userId: string, id: string): Promise<StockDto> {
    const stock = await this.getOwnedStock(userId, id);
    return this.toStockDto(stock);
  }

  async create(userId: string, dto: CreateStockDto): Promise<StockDto> {
    const stock = await this.prisma.stock.create({
      data: {
        userId,
        name: dto.name.trim(),
        quantity: dto.quantity,
        unit: dto.unit.trim(),
        type: dto.type as PrismaStockType,
      },
    });

    if (dto.quantity > 0) {
      await this.prisma.stockHistory.create({
        data: {
          userId,
          type: dto.type as PrismaStockType,
          name: stock.name,
          quantity: dto.quantity,
          unit: stock.unit,
          level: PrismaLevel.IN,
          date: new Date(),
        },
      });
    }

    return this.toStockDto(stock);
  }

  async update(userId: string, id: string, dto: UpdateStockDto): Promise<StockDto> {
    await this.getOwnedStock(userId, id);

    const stock = await this.prisma.stock.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type as PrismaStockType } : {}),
      },
    });

    return this.toStockDto(stock);
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    await this.getOwnedStock(userId, id);
    await this.prisma.stock.delete({ where: { id } });
    return { success: true };
  }

  async move(userId: string, id: string, dto: MoveStockDto): Promise<StockDto> {
    const stock = await this.getOwnedStock(userId, id);

    const nextQuantity =
      dto.level === StockMovementLevel.IN
        ? stock.quantity + dto.quantity
        : stock.quantity - dto.quantity;

    if (nextQuantity < 0) {
      throw new BadRequestException('Stock insuffisant pour cette sortie');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.stock.update({
        where: { id },
        data: { quantity: nextQuantity },
      }),
      this.prisma.stockHistory.create({
        data: {
          userId,
          type: stock.type,
          name: stock.name,
          quantity: dto.quantity,
          unit: stock.unit,
          level: dto.level as PrismaLevel,
          date: dto.date ? new Date(dto.date) : new Date(),
        },
      }),
    ]);

    return this.toStockDto(updated);
  }

  async listHistory(
    userId: string,
    options?: { type?: StockType; level?: StockMovementLevel },
  ): Promise<StockHistoryDto[]> {
    const history = await this.prisma.stockHistory.findMany({
      where: {
        userId,
        ...(options?.type ? { type: options.type as PrismaStockType } : {}),
        ...(options?.level ? { level: options.level as PrismaLevel } : {}),
      },
      orderBy: { date: 'desc' },
      take: 200,
    });

    return history.map((item) => this.toHistoryDto(item));
  }

  private async getOwnedStock(userId: string, id: string) {
    const stock = await this.prisma.stock.findUnique({ where: { id } });
    if (!stock) {
      throw new NotFoundException('Article de stock introuvable');
    }
    if (stock.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cet article');
    }
    return stock;
  }

  private toStockDto(stock: {
    id: string;
    userId: string;
    name: string;
    quantity: number;
    unit: string;
    type: PrismaStockType;
    createdAt: Date;
    updatedAt: Date;
  }): StockDto {
    return {
      id: stock.id,
      userId: stock.userId,
      name: stock.name,
      quantity: stock.quantity,
      unit: stock.unit,
      type: stock.type as StockType,
      createdAt: stock.createdAt.toISOString(),
      updatedAt: stock.updatedAt.toISOString(),
    };
  }

  private toHistoryDto(item: {
    id: string;
    userId: string;
    type: PrismaStockType;
    name: string;
    quantity: number;
    unit: string;
    level: PrismaLevel;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }): StockHistoryDto {
    return {
      id: item.id,
      userId: item.userId,
      type: item.type as StockType,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      level: item.level as StockMovementLevel,
      date: item.date.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
