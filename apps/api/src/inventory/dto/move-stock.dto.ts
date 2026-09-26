import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StockMovementLevel } from '@agrimanage/shared';

export class MoveStockDto {
  @IsEnum(StockMovementLevel)
  level!: StockMovementLevel;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}
