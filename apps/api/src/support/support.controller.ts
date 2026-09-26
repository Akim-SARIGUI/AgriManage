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
import { Role, SupportStatus } from '@agrimanage/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { SupportService } from './support.service';
import {
  CreateTicketDto,
  RespondTicketDto,
  UpdateTicketDto,
  UpdateTicketStatusDto,
} from './dto/ticket.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('support/tickets')
  @Roles(Role.USER)
  listMine(@CurrentUser() user: RequestUser) {
    return this.supportService.listMine(user.id);
  }

  @Get('support/tickets/:id')
  @Roles(Role.USER)
  findMine(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.findOneForUser(user.id, id);
  }

  @Post('support/tickets')
  @Roles(Role.USER)
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateTicketDto) {
    const profile = await this.prisma.user.findUnique({ where: { id: user.id } });
    return this.supportService.create(
      user.id,
      user.email,
      profile?.fullName ?? user.email,
      dto,
    );
  }

  @Patch('support/tickets/:id')
  @Roles(Role.USER)
  updateMine(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.supportService.updateMine(user.id, id, dto);
  }

  @Delete('support/tickets/:id')
  @Roles(Role.USER)
  removeMine(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.removeMine(user.id, id);
  }

  @Get('admin/support/tickets')
  @Roles(Role.ADMIN)
  listAll(
    @Query('status', new ParseEnumPipe(SupportStatus, { optional: true }))
    status?: SupportStatus,
  ) {
    return this.supportService.listAll(status);
  }

  @Get('admin/support/tickets/:id')
  @Roles(Role.ADMIN)
  findAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.findOneAdmin(id);
  }

  @Patch('admin/support/tickets/:id/respond')
  @Roles(Role.ADMIN)
  respond(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RespondTicketDto) {
    return this.supportService.respond(id, dto);
  }

  @Patch('admin/support/tickets/:id/status')
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateStatus(id, body.status);
  }

  @Delete('admin/support/tickets/:id')
  @Roles(Role.ADMIN)
  removeAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.removeAdmin(id);
  }
}
