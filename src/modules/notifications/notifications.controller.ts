import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(
    @Query() query: QueryNotificationsDto,
    @CurrentUser() user: { user_id: number },
  ) {
    return this.notificationsService.findMine(user.user_id, query);
  }

  @Get('count')
  countUnread(@CurrentUser() user: { user_id: number }) {
    return this.notificationsService.countUnread(user.user_id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: { user_id: number }) {
    return this.notificationsService.markAllAsRead(user.user_id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { user_id: number },
  ) {
    return this.notificationsService.markAsRead(id, user.user_id);
  }

  @Delete('read')
  removeRead(@CurrentUser() user: { user_id: number }) {
    return this.notificationsService.removeRead(user.user_id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { user_id: number },
  ) {
    return this.notificationsService.remove(id, user.user_id);
  }
}