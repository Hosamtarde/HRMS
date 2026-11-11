import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { RecruitmentStatus } from '../../common/enums/enums';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';
import { RecruitmentEntity } from './recruitment.entity';
import {
  buildReminderEvent,
  getReminderWindow,
} from './interview-reminder.helper';

@Injectable()
export class InterviewReminderService {
  private readonly logger = new Logger(InterviewReminderService.name);

  constructor(
    @InjectRepository(RecruitmentEntity)
    private readonly recruitmentRepository: Repository<RecruitmentEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendDueReminders(): Promise<void> {
    try {
      await this.processDueReminders(new Date());
    } catch (error) {
      this.logger.error(
        `Interview reminders failed: ${(error as Error).message}`,
      );
    }
  }

  async processDueReminders(now: Date): Promise<number> {
    const { from, to } = getReminderWindow(now);

    const due = await this.recruitmentRepository.find({
      where: {
        application_status: RecruitmentStatus.INTERVIEW_SCHEDULED,
        reminder_sent_at: IsNull(),
        interview_at: Between(from, to),
      },
    });

    let sent = 0;
    for (const application of due) {
      const event = buildReminderEvent(application);
      if (!event) {
        continue;
      }

      const claim = await this.recruitmentRepository.update(
        {
          application_id: application.application_id,
          reminder_sent_at: IsNull(),
        },
        { reminder_sent_at: now },
      );
      if (!claim.affected) {
        continue;
      }

      this.eventEmitter.emit(NOTIFICATION_EVENTS.INTERVIEW_REMINDER, event);
      sent += 1;
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} interview reminders`);
    }
    return sent;
  }
}
