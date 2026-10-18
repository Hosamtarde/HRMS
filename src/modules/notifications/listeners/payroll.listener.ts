import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import { NotificationType } from '../../../common/enums/enums';

export interface PayslipEvent {
  payrollId: number;
  userId: number;
  salaryMonth: string;
  netSalary: number;
}

export interface LoanInstalmentEvent {
  userId: number;
  salaryMonth: string;
  amount: number;
}

@Injectable()
export class PayrollListener {
  private readonly logger = new Logger(PayrollListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NOTIFICATION_EVENTS.PAYSLIP_GENERATED)
  async onPayslip(event: PayslipEvent) {
    try {
      await this.notificationsService.create({
        user_id: event.userId,
        type: NotificationType.PAYSLIP_GENERATED,
        title: 'كشف راتبك جاهز',
        message: `صافي راتب شهر ${event.salaryMonth} هو ${event.netSalary}.`,
        link: `/payroll/${event.payrollId}`,
      });
    } catch (error) {
      this.logger.error(
        `Could not notify user #${event.userId} about payroll #${event.payrollId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.LOAN_INSTALMENT_PAID)
  async onInstalment(event: LoanInstalmentEvent) {
    try {
      await this.notificationsService.create({
        user_id: event.userId,
        type: NotificationType.LOAN_INSTALMENT_PAID,
        title: 'خُصم قسط سلفة',
        message: `خُصم قسط بقيمة ${event.amount} من راتب شهر ${event.salaryMonth}.`,
      });
    } catch (error) {
      this.logger.error(
        `Could not notify user #${event.userId} about a loan instalment`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}