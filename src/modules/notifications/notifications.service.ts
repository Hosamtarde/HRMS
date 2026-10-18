import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const notification = this.notificationsRepository.create(dto);
    await this.notificationsRepository.save(notification);
    this.logger.log(`Notification #${notification.notification_id} (${dto.type}) for user #${dto.user_id}`);
    return notification;
  }

  async createMany(items: CreateNotificationDto[]): Promise<NotificationEntity[]> {
    if (!items.length) return [];
    const rows = this.notificationsRepository.create(items);
    await this.notificationsRepository.insert(rows);
    this.logger.log(`${rows.length} notifications (${items[0].type}) written in one insert`);
    return rows;
  }

  async findMine(
    userId: number,
    query: QueryNotificationsDto,
  ): Promise<PaginatedResult<NotificationEntity>> {
    const { page, limit, unreadOnly } = query;

    const where = unreadOnly
      ? { user_id: userId, is_read: false }
      : { user_id: userId };

    const [data, total] = await this.notificationsRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async countUnread(userId: number): Promise<{ unread: number }> {
    const unread = await this.notificationsRepository.count({
      where: { user_id: userId, is_read: false },
    });
    return { unread };
  }

  async markAsRead(id: number, userId: number): Promise<NotificationEntity> {
    const notification = await this.findOwned(id, userId);
    if (notification.is_read) return notification;

    notification.is_read = true;
    await this.notificationsRepository.save(notification);
    return notification;
  }

  async markAllAsRead(userId: number): Promise<{ updated: number }> {
    const result = await this.notificationsRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
    return { updated: result.affected ?? 0 };
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const notification = await this.findOwned(id, userId);
    await this.notificationsRepository.remove(notification);
    return { message: `Notification #${id} has been deleted` };
  }

  async removeRead(userId: number): Promise<{ deleted: number }> {
    const result = await this.notificationsRepository.delete({
      user_id: userId,
      is_read: true,
    });
    return { deleted: result.affected ?? 0 };
  }

  private async findOwned(id: number, userId: number): Promise<NotificationEntity> {
    const notification = await this.notificationsRepository.findOne({
      where: { notification_id: id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }
    if (notification.user_id !== userId) {
      throw new ForbiddenException('This notification is not yours');
    }
    return notification;
  }
}