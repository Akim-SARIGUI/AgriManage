import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ExpenseDto, FinanceSummaryDto, RevenueDto } from '@agrimanage/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<FinanceSummaryDto> {
    const [revenues, expenses] = await Promise.all([
      this.prisma.revenue.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = revenues._sum.amount ?? 0;
    const totalExpense = expenses._sum.amount ?? 0;

    return {
      totalRevenue,
      totalExpense,
      balance: totalRevenue - totalExpense,
    };
  }

  async listRevenues(userId: string): Promise<RevenueDto[]> {
    const items = await this.prisma.revenue.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return items.map((item) => this.toRevenueDto(item));
  }

  async createRevenue(userId: string, dto: CreateRevenueDto): Promise<RevenueDto> {
    const item = await this.prisma.revenue.create({
      data: {
        userId,
        amount: dto.amount,
        source: dto.source.trim(),
        date: new Date(dto.date),
      },
    });
    return this.toRevenueDto(item);
  }

  async updateRevenue(
    userId: string,
    id: string,
    dto: UpdateRevenueDto,
  ): Promise<RevenueDto> {
    await this.getOwnedRevenue(userId, id);
    const item = await this.prisma.revenue.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.source !== undefined ? { source: dto.source.trim() } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      },
    });
    return this.toRevenueDto(item);
  }

  async removeRevenue(userId: string, id: string): Promise<{ success: true }> {
    await this.getOwnedRevenue(userId, id);
    await this.prisma.revenue.delete({ where: { id } });
    return { success: true };
  }

  async listExpenses(userId: string): Promise<ExpenseDto[]> {
    const items = await this.prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return items.map((item) => this.toExpenseDto(item));
  }

  async createExpense(userId: string, dto: CreateExpenseDto): Promise<ExpenseDto> {
    const item = await this.prisma.expense.create({
      data: {
        userId,
        amount: dto.amount,
        category: dto.category.trim(),
        date: new Date(dto.date),
      },
    });
    return this.toExpenseDto(item);
  }

  async updateExpense(
    userId: string,
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseDto> {
    await this.getOwnedExpense(userId, id);
    const item = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      },
    });
    return this.toExpenseDto(item);
  }

  async removeExpense(userId: string, id: string): Promise<{ success: true }> {
    await this.getOwnedExpense(userId, id);
    await this.prisma.expense.delete({ where: { id } });
    return { success: true };
  }

  private async getOwnedRevenue(userId: string, id: string) {
    const item = await this.prisma.revenue.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Revenu introuvable');
    if (item.userId !== userId) throw new ForbiddenException('Accès refusé à ce revenu');
    return item;
  }

  private async getOwnedExpense(userId: string, id: string) {
    const item = await this.prisma.expense.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Dépense introuvable');
    if (item.userId !== userId) throw new ForbiddenException('Accès refusé à cette dépense');
    return item;
  }

  private toRevenueDto(item: {
    id: string;
    userId: string;
    amount: number;
    source: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }): RevenueDto {
    return {
      id: item.id,
      userId: item.userId,
      amount: item.amount,
      source: item.source,
      date: item.date.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private toExpenseDto(item: {
    id: string;
    userId: string;
    amount: number;
    category: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ExpenseDto {
    return {
      id: item.id,
      userId: item.userId,
      amount: item.amount,
      category: item.category,
      date: item.date.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
