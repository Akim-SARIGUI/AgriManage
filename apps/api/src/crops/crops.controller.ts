import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@agrimanage/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { CropsService } from './crops.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Get('crops')
  findAll(@CurrentUser() user: RequestUser, @Query('parcelId') parcelId?: string) {
    return this.cropsService.findAllForUser(user.id, parcelId);
  }

  @Get('crops/:id')
  findOne(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cropsService.findOneForUser(user.id, id);
  }

  @Post('crops')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCropDto) {
    return this.cropsService.create(user.id, dto);
  }

  @Patch('crops/:id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCropDto,
  ) {
    return this.cropsService.update(user.id, id, dto);
  }

  @Delete('crops/:id')
  remove(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cropsService.remove(user.id, id);
  }

  @Post('crops/:cropId/activities')
  createActivity(
    @CurrentUser() user: RequestUser,
    @Param('cropId', ParseUUIDPipe) cropId: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.cropsService.createActivity(user.id, cropId, dto);
  }

  @Patch('activities/:id')
  updateActivity(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.cropsService.updateActivity(user.id, id, dto);
  }

  @Delete('activities/:id')
  removeActivity(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cropsService.removeActivity(user.id, id);
  }

  @Post('activities/:activityId/interventions')
  createIntervention(
    @CurrentUser() user: RequestUser,
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Body() dto: CreateInterventionDto,
  ) {
    return this.cropsService.createIntervention(user.id, activityId, dto);
  }

  @Delete('interventions/:id')
  removeIntervention(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cropsService.removeIntervention(user.id, id);
  }
}
