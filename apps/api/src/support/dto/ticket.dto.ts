import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SupportStatus } from '@agrimanage/shared';

export class CreateTicketDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message?: string;
}

export class RespondTicketDto {
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  response!: string;

  @IsOptional()
  @IsEnum(SupportStatus)
  status?: SupportStatus;
}

export class UpdateTicketStatusDto {
  @IsEnum(SupportStatus)
  status!: SupportStatus;
}
