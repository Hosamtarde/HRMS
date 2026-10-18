import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { RecipientsService } from '../recipients.service';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import { NotificationType, RequestType } from '../../../common/enums/enums';

const REQUEST_LABELS: Record<string, string> = {
  [RequestType.LEAVE]: 'إجازة',
  [RequestType.LOAN]: 'سلفة',
  [RequestType.PERMISSION]: 'استئذان',
  [RequestType.CUSTOM]: 'طلب خاص',
};

export interface RequestEvent {
  requestId: number;
  employeeId: number;
  requestType: RequestType;
}

export interface RequestReviewedEvent extends RequestEvent {
  reviewerId: number;
  approved: boolean;
}

@Injectable()
export class RequestsListener {
  private readonly logger = new Logger(RequestsListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly recipients: RecipientsService,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.REQUEST_SUBMITTED)
  async onSubmitted(event: RequestEvent) {
    try {
      const [approvers, name] = await Promise.all([
        this.recipients.getApproverIds(event.employeeId),
        this.recipients.getName(event.employeeId),
      ]);

      const label = REQUEST_LABELS[event.requestType] ?? 'طلب';

      await this.notificationsService.createMany(
        approvers.map((userId) => ({
          user_id: userId,
          type: NotificationType.REQUEST_SUBMITTED,
          title: 'طلب جديد بانتظار قرارك',
          message: `قدّم ${name} طلب ${label}.`,
          link: `/requests/${event.requestId}`,
        })),
      );
    } catch (error) {
      this.logger.error(
        `Could not notify approvers about request #${event.requestId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.REQUEST_REVIEWED)
  async onReviewed(event: RequestReviewedEvent) {
    try {
      const reviewer = await this.recipients.getName(event.reviewerId);
      const label = REQUEST_LABELS[event.requestType] ?? 'طلب';
      const verb = event.approved ? 'وافق على' : 'رفض';

      await this.notificationsService.create({
        user_id: event.employeeId,
        type: NotificationType.REQUEST_REVIEWED,
        title: event.approved ? 'تمت الموافقة على طلبك' : 'تم رفض طلبك',
        message: `${reviewer} ${verb} طلب ${label} الخاص بك.`,
        link: `/requests/${event.requestId}`,
      });
    } catch (error) {
      this.logger.error(
        `Could not notify employee #${event.employeeId} about request #${event.requestId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.REQUEST_CANCELLED)
  async onCancelled(event: RequestEvent) {
    try {
      const [approvers, name] = await Promise.all([
        this.recipients.getApproverIds(event.employeeId),
        this.recipients.getName(event.employeeId),
      ]);

      const label = REQUEST_LABELS[event.requestType] ?? 'طلب';

      await this.notificationsService.createMany(
        approvers.map((userId) => ({
          user_id: userId,
          type: NotificationType.REQUEST_CANCELLED,
          title: 'تم سحب طلب',
          message: `سحب ${name} طلب ${label} قبل البتّ فيه.`,
        })),
      );
    } catch (error) {
      this.logger.error(
        `Could not notify approvers about cancelled request #${event.requestId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}