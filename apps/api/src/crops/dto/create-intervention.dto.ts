import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInterventionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
