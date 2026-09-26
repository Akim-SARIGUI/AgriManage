import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@agrimanage/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { FinanceService } from './finance.service';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  summary(@CurrentUser() user: RequestUser) {
    return this.financeService.getSummary(user.id);
  }

  @Get('revenues')
  listRevenues(@CurrentUser() user: RequestUser) {
    return this.financeService.listRevenues(user.id);
  }

  @Post('revenues')
  createRevenue(@CurrentUser() user: RequestUser, @Body() dto: CreateRevenueDto) {
    return this.financeService.createRevenue(user.id, dto);
  }

  @Patch('revenues/:id')
  updateRevenue(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRevenueDto,
  ) {
    return this.financeService.updateRevenue(user.id, id, dto);
  }

  @Delete('revenues/:id')
  removeRevenue(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.removeRevenue(user.id, id);
  }

  @Get('expenses')
  listExpenses(@CurrentUser() user: RequestUser) {
    return this.financeService.listExpenses(user.id);
  }

  @Post('expenses')
  createExpense(@CurrentUser() user: RequestUser, @Body() dto: CreateExpenseDto) {
    return this.financeService.createExpense(user.id, dto);
  }

  @Patch('expenses/:id')
  updateExpense(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.financeService.updateExpense(user.id, id, dto);
  }

  @Delete('expenses/:id')
  removeExpense(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.removeExpense(user.id, id);
  }
}
