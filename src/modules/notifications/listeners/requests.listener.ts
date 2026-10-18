import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import { NotificationType } from '../../../common/enums/enums';

export interface RequestSubmittedEvent {
  managerId: number;
  employeeName: string;
  requestType: string;
  requestId: number;
}

export interface RequestReviewedEvent {
  employeeId: number;
  reviewerName: string;
  requestType: string;
  requestId: number;
  approved: boolean;
}

@Injectable()
export class RequestsListener {
  private readonly logger = new Logger(RequestsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NOTIFICATION_EVENTS.REQUEST_SUBMITTED)
  async onSubmitted(event: RequestSubmittedEvent) {
    try {
      await this.notificationsService.create({
        user_id: event.managerId,
        type: NotificationType.REQUEST_SUBMITTED,
        title: 'طلب جديد بانتظار قرارك',
        message: `قدّم ${event.employeeName} طلب ${event.requestType}.`,
        link: `/requests/${event.requestId}`,
      });
    } catch (error) {
      this.logger.error(
        `Could not notify manager #${event.managerId} about request #${event.requestId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.REQUEST_REVIEWED)
  async onReviewed(event: RequestReviewedEvent) {
    try {
      const decision = event.approved ? 'الموافقة على' : 'رفض';
      await this.notificationsService.create({
        user_id: event.employeeId,
        type: NotificationType.REQUEST_REVIEWED,
        title: `تمت ${decision} طلبك`,
        message: `${event.reviewerName} ${event.approved ? 'وافق على' : 'رفض'} طلب ${event.requestType} الخاص بك.`,
        link: `/requests/${event.requestId}`,
      });
    } catch (error) {
      this.logger.error(
        `Could not notify employee #${event.employeeId} about request #${event.requestId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}