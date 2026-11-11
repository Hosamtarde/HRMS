import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../../mail/mail.service';
import { NotificationsService } from '../notifications.service';
import { RecipientsService } from '../recipients.service';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import { NotificationType } from '../../../common/enums/enums';
import { COMPANY_NAME } from '../../../common/constants/notification.constants';
import type { InterviewReminderEvent } from '../../recruitment/interview-reminder.helper';
import { formatInterviewTime } from '../interview-message.helper';

@Injectable()
export class InterviewReminderListener {
  private readonly logger = new Logger(InterviewReminderListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly recipients: RecipientsService,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.INTERVIEW_REMINDER)
  async onInterviewReminder(event: InterviewReminderEvent): Promise<void> {
    const when = formatInterviewTime(event.interviewAt);
    await Promise.all([
      this.notifyCandidate(event, when),
      this.notifyPanel(event, when),
    ]);
  }

  private async notifyCandidate(
    event: InterviewReminderEvent,
    when: string,
  ): Promise<void> {
    await this.mailService.send(
      event.email,
      `تذكير بموعد مقابلتك \u2014 ${event.position}`,
      'interview-reminder',
      {
        applicantName: event.applicantName,
        positionTitle: event.position,
        companyName: COMPANY_NAME,
        interviewTime: when,
        meetingUrl: event.meetingUrl,
      },
    );
  }

  private async notifyPanel(
    event: InterviewReminderEvent,
    when: string,
  ): Promise<void> {
    try {
      const adminIds = await this.recipients.getHrAdminIds();

      await this.notificationsService.createMany(
        adminIds.map((userId) => ({
          user_id: userId,
          type: NotificationType.INTERVIEW_SCHEDULED,
          title: 'تذكير: مقابلة قريبة',
          message: `مقابلة ${event.applicantName} لوظيفة ${event.position} بتاريخ ${when}. رابط الغرفة: ${event.meetingUrl}`,
          link: `/recruitment/${event.applicationId}`,
        })),
      );
    } catch (error) {
      this.logger.error(
        `Could not remind the panel about the interview of application #${event.applicationId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
