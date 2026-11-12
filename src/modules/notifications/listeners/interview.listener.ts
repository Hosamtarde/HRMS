import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../../mail/mail.service';
import { NotificationsService } from '../notifications.service';
import { RecipientsService } from '../recipients.service';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import { NotificationType } from '../../../common/enums/enums';
import { COMPANY_NAME } from '../../../common/constants/notification.constants';
import type { InterviewScheduledEvent } from '../../recruitment/interview.helper';
import { formatInterviewTime } from '../interview-message.helper';

@Injectable()
export class InterviewListener {
  private readonly logger = new Logger(InterviewListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly recipients: RecipientsService,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.INTERVIEW_SCHEDULED)
  async onInterviewScheduled(event: InterviewScheduledEvent): Promise<void> {
    const when = formatInterviewTime(event.interviewAt);
    await Promise.all([
      this.notifyCandidate(event, when),
      this.notifyPanel(event, when),
    ]);
  }

  private async notifyCandidate(
    event: InterviewScheduledEvent,
    when: string,
  ): Promise<void> {
    await this.mailService.send(
      event.email,
      event.rescheduled
        ? `تم تغيير موعد مقابلتك \u2014 ${event.position}`
        : `دعوة لمقابلة شخصية \u2014 ${event.position}`,
      'interview-scheduled',
      {
        applicantName: event.applicantName,
        positionTitle: event.position,
        companyName: COMPANY_NAME,
        interviewTime: when,
        meetingUrl: event.meetingUrl,
        rescheduled: event.rescheduled,
      },
    );
  }

  private async notifyPanel(
    event: InterviewScheduledEvent,
    when: string,
  ): Promise<void> {
    try {
      const adminIds = await this.recipients.getHrAdminIds();

      await this.notificationsService.createMany(
        adminIds.map((userId) => ({
          user_id: userId,
          type: NotificationType.INTERVIEW_SCHEDULED,
          title: event.rescheduled
            ? 'تم تغيير موعد مقابلة'
            : 'مقابلة جديدة مجدولة',
          message: `مقابلة ${event.applicantName} لوظيفة ${event.position} بتاريخ ${when}. رابط الغرفة: ${event.meetingUrl}`,
          link: `/recruitment/${event.applicationId}`,
        })),
      );
    } catch (error) {
      this.logger.error(
        `Could not notify the panel about the interview of application #${event.applicationId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
