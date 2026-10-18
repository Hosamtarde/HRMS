import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import { NotificationType } from '../../../common/enums/enums';

export interface LeaveBalanceLowEvent {
  userId: number;
  typeName: string;
  remainingDays: number;
}

@Injectable()
export class MiscListener {
  private readonly logger = new Logger(MiscListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NOTIFICATION_EVENTS.LEAVE_BALANCE_LOW)
  async onBalanceLow(event: LeaveBalanceLowEvent) {
    try {
      await this.notificationsService.create({
        user_id: event.userId,
        type: NotificationType.LEAVE_BALANCE_LOW,
        title: 'رصيد إجازاتك شارف على الانتهاء',
        message: `تبقّى لك ${event.remainingDays} يوم من رصيد "${event.typeName}".`,
        link: '/leave-balances/me',
      });
    } catch (error) {
      this.logger.error(
        `Could not notify user #${event.userId} about a low leave balance`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}