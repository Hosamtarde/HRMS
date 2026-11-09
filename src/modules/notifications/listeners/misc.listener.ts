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

export interface ManagerChangedEvent {
  userId: number;
  employeeName: string;
  managerId: number | null;
  managerName: string | null;
  previousManagerId: number | null;
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

  @OnEvent(NOTIFICATION_EVENTS.MANAGER_CHANGED)
  async onManagerChanged(event: ManagerChangedEvent) {
    try {
      await this.notificationsService.create({
        user_id: event.userId,
        type: NotificationType.MANAGER_CHANGED,
        title: 'تم تحديث مديرك المباشر',
        message: event.managerName
          ? `صار ${event.managerName} مديرك المباشر.`
          : 'ما عاد لك مدير مباشر. تواصل مع الموارد البشرية.',
        link: '/org-chart/me',
      });
      if (event.managerId) {
        await this.notificationsService.create({
          user_id: event.managerId,
          type: NotificationType.MANAGER_CHANGED,
          title: 'موظف جديد في فريقك',
          message: `${event.employeeName} صار يتبعك مباشرة.`,
          link: '/org-chart/me',
        });
      }
      if (
        event.previousManagerId &&
        event.previousManagerId !== event.managerId
      ) {
        await this.notificationsService.create({
          user_id: event.previousManagerId,
          type: NotificationType.MANAGER_CHANGED,
          title: 'تغيّر فريقك',
          message: `${event.employeeName} ما عاد يتبعك.`,
          link: '/org-chart/me',
        });
      }
    } catch (error) {
      this.logger.error(
        `Could not notify about the manager change of user #${event.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
