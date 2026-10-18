import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { RecipientsService } from '../recipients.service';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import { NotificationType } from '../../../common/enums/enums';

export interface PlanActivatedEvent {
  planId: number;
  planName: string;
  reviewerIds: number[];
  reviewCount: number;
}

export interface ReviewSubmittedEvent {
  reviewId: number;
  planName: string;
  reviewedUserId: number;
  percentage: number;
}

export interface ReviewReopenedEvent {
  reviewId: number;
  planName: string;
  reviewerId: number;
  employeeName: string;
}

@Injectable()
export class PerformanceListener {
  private readonly logger = new Logger(PerformanceListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly recipients: RecipientsService,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.PLAN_ACTIVATED)
  async onPlanActivated(event: PlanActivatedEvent) {
    try {
      await this.notificationsService.createMany(
        event.reviewerIds.map((userId) => ({
          user_id: userId,
          type: NotificationType.REVIEW_PENDING,
          title: 'تقييمات بانتظارك',
          message: `بدأت خطة "${event.planName}". عليك تعبئة تقييمات موظفي قسمك.`,
          link: `/performance/reviews/pending`,
        })),
      );
    } catch (error) {
      this.logger.error(
        `Could not notify reviewers about plan #${event.planId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.REVIEW_SUBMITTED)
  async onReviewSubmitted(event: ReviewSubmittedEvent) {
    try {
      await this.notificationsService.create({
        user_id: event.reviewedUserId,
        type: NotificationType.REVIEW_SUBMITTED,
        title: 'صدرت نتيجة تقييمك',
        message: `نتيجتك في "${event.planName}" هي ${event.percentage}%.`,
        link: `/performance/reviews/${event.reviewId}`,
      });
    } catch (error) {
      this.logger.error(
        `Could not notify employee #${event.reviewedUserId} about review #${event.reviewId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.REVIEW_REOPENED)
  async onReviewReopened(event: ReviewReopenedEvent) {
    try {
      await this.notificationsService.create({
        user_id: event.reviewerId,
        type: NotificationType.REVIEW_REOPENED,
        title: 'أُعيد فتح تقييم',
        message: `أعادت الموارد البشرية فتح تقييم ${event.employeeName} في "${event.planName}". إجاباتك السابقة محفوظة.`,
        link: `/performance/reviews/${event.reviewId}`,
      });
    } catch (error) {
      this.logger.error(
        `Could not notify reviewer #${event.reviewerId} about review #${event.reviewId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}