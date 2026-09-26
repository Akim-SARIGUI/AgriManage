import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Role } from '@agrimanage/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WeatherService } from './weather.service';

class ForecastQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsString()
  locationName?: string;
}

class SearchQueryDto {
  @IsString()
  @MinLength(2)
  q!: string;
}

@Controller('weather')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('forecast')
  forecast(@Query() query: ForecastQueryDto) {
    return this.weatherService.getForecast(
      query.latitude,
      query.longitude,
      query.locationName,
    );
  }

  @Get('search')
  search(@Query() query: SearchQueryDto) {
    return this.weatherService.searchLocations(query.q);
  }
}
