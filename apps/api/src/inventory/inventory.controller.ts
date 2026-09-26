import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, StockMovementLevel, StockType } from '@agrimanage/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { InventoryService, LOW_STOCK_THRESHOLD } from './inventory.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { MoveStockDto } from './dto/move-stock.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stocks/meta')
  meta() {
    return { lowStockThreshold: LOW_STOCK_THRESHOLD };
  }

  @Get('stocks')
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('type', new ParseEnumPipe(StockType, { optional: true })) type?: StockType,
  ) {
    return this.inventoryService.findAll(user.id, type);
  }

  @Get('stocks/:id')
  findOne(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(user.id, id);
  }

  @Post('stocks')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateStockDto) {
    return this.inventoryService.create(user.id, dto);
  }

  @Patch('stocks/:id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.inventoryService.update(user.id, id, dto);
  }

  @Delete('stocks/:id')
  remove(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.remove(user.id, id);
  }

  @Post('stocks/:id/move')
  move(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveStockDto,
  ) {
    return this.inventoryService.move(user.id, id, dto);
  }

  @Get('stock-history')
  history(
    @CurrentUser() user: RequestUser,
    @Query('type', new ParseEnumPipe(StockType, { optional: true })) type?: StockType,
    @Query('level', new ParseEnumPipe(StockMovementLevel, { optional: true }))
    level?: StockMovementLevel,
  ) {
    return this.inventoryService.listHistory(user.id, { type, level });
  }
}
