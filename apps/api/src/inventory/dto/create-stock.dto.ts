import { IsEnum, IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { StockType } from '@agrimanage/shared';

export class CreateStockDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  quantity!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  unit!: string;

  @IsEnum(StockType)
  type!: StockType;
}
