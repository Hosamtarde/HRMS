import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../../mail/mail.service';
import { RecipientsService } from '../recipients.service';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import {
  COMPANY_NAME,
  REQUEST_LABELS,
} from '../../../common/constants/notification.constants';
import { RequestType } from '../../../common/enums/enums';
import type { PayslipEvent } from './payroll.listener';
import type { ReviewSubmittedEvent } from './performance.listener';

interface RequestReviewedMailEvent {
  requestId: number;
  employeeId: number;
  requestType: RequestType;
  reviewerId: number;
  approved: boolean;
}

interface ApplicationStatusMailEvent {
  applicationId: number;
  applicantName: string;
  email: string;
  position: string;
  status: string;
}

const APPLICATION_MESSAGES: Record<string, string> = {
  pending: 'استلمنا طلبك وهو الآن قيد المراجعة من قبل فريق التوظيف.',
  shortlisted:
    'يسعدنا إبلاغك بأن طلبك اجتاز المراجعة الأولية، وتم إدراجك ضمن القائمة المختصرة.',
  interview_scheduled:
    'يسعدنا دعوتك لمقابلة شخصية، وسيتواصل معك فريقنا لتحديد الموعد.',
  accepted: 'يسعدنا إبلاغك بقبول طلبك. أهلاً بك معنا.',
  rejected:
    'نشكرك على اهتمامك بالعمل معنا. لم يتم اختيارك لهذه الوظيفة، ونتمنى لك التوفيق.',
};

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly recipientsService: RecipientsService,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.APPLICATION_STATUS)
  async onApplicationStatus(event: ApplicationStatusMailEvent): Promise<void> {
    await this.mailService.send(
      event.email,
      `تحديث على طلب التوظيف — ${event.position}`,
      'application-status',
      {
        applicantName: event.applicantName,
        positionTitle: event.position,
        companyName: COMPANY_NAME,
        statusMessage:
          APPLICATION_MESSAGES[event.status] ??
          'تم تحديث حالة طلبك، يرجى التواصل معنا لمزيد من التفاصيل.',
      },
    );
  }

  @OnEvent(NOTIFICATION_EVENTS.REQUEST_REVIEWED)
  async onRequestReviewed(event: RequestReviewedMailEvent): Promise<void> {
    const contact = await this.recipientsService.getContact(event.employeeId);

    if (!contact) {
      this.logger.warn(`No contact found for user #${event.employeeId}`);
      return;
    }

    await this.mailService.send(
      contact.email,
      `نتيجة طلب ${REQUEST_LABELS[event.requestType]}`,
      'request-reviewed',
      {
        employeeName: contact.name,
        requestLabel: REQUEST_LABELS[event.requestType],
        companyName: COMPANY_NAME,
        statusText: event.approved ? 'تمت الموافقة على طلبك' : 'تم رفض طلبك',
        statusColor: event.approved ? '#16a34a' : '#dc2626',
      },
    );
  }

  @OnEvent(NOTIFICATION_EVENTS.PAYSLIP_GENERATED)
  async onPayslip(event: PayslipEvent): Promise<void> {
    const contact = await this.recipientsService.getContact(event.userId);

    if (!contact) {
      this.logger.warn(`No contact found for user #${event.userId}`);
      return;
    }

    await this.mailService.send(
      contact.email,
      `كشف راتب ${event.salaryMonth}`,
      'payslip-generated',
      {
        employeeName: contact.name,
        salaryMonth: event.salaryMonth,
        netSalary: event.netSalary.toFixed(2),
        companyName: COMPANY_NAME,
      },
    );
  }

  @OnEvent(NOTIFICATION_EVENTS.REVIEW_SUBMITTED)
  async onReviewSubmitted(event: ReviewSubmittedEvent): Promise<void> {
    const contact = await this.recipientsService.getContact(
      event.reviewedUserId,
    );

    if (!contact) {
      this.logger.warn(`No contact found for user #${event.reviewedUserId}`);
      return;
    }

    await this.mailService.send(
      contact.email,
      `نتيجة تقييم الأداء — ${event.planName}`,
      'review-submitted',
      {
        employeeName: contact.name,
        planName: event.planName,
        percentage: event.percentage,
        companyName: COMPANY_NAME,
      },
    );
  }
}