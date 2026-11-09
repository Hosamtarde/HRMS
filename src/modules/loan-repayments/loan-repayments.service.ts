import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LoanRepaymentEntity } from './loan-repayment.entity';
import { RequestEntity } from '../requests/request.entity';
import { RepaymentStatus } from '../../common/enums/enums';
import { buildSchedule, summariseLoan } from './loan-repayment.helper';

@Injectable()
export class LoanRepaymentsService {
  private readonly logger = new Logger(LoanRepaymentsService.name);

  constructor(
    @InjectRepository(LoanRepaymentEntity)
    private readonly repaymentsRepository: Repository<LoanRepaymentEntity>,
  ) {}

  async generateSchedule(
    manager: EntityManager,
    request: RequestEntity,
  ): Promise<void> {
    const repo = manager.getRepository(LoanRepaymentEntity);

    const schedule = buildSchedule(
      request.loan_amount,
      request.repayment_period,
      new Date(),
    );

    const rows = schedule.map((row) =>
      repo.create({
        request_id: request.request_id,
        installment_no: row.installment_no,
        due_date: row.due_date,
        amount: row.amount,
        repayment_status: RepaymentStatus.PENDING,
      }),
    );

    await repo.save(rows);

    this.logger.log(
      `Generated ${schedule.length} instalments for loan #${request.request_id} ` +
        `- ${Number(request.loan_amount)} total, ${schedule[0]?.amount ?? 0} a month`,
    );
  }

  async consumeNextInstallment(
    manager: EntityManager,
    userId: number,
    payrollId: number | null,
  ): Promise<number> {
    const repo = manager.getRepository(LoanRepaymentEntity);

    const next = await repo
      .createQueryBuilder('repayment')
      .innerJoin('repayment.request', 'request')
      .where('request.user_id = :userId', { userId })
      .andWhere('repayment.repayment_status = :status', {
        status: RepaymentStatus.PENDING,
      })
      .orderBy('repayment.due_date', 'ASC')
      .addOrderBy('repayment.installment_no', 'ASC')
      .setLock('pessimistic_write')
      .getOne();

    if (!next) {
      return 0;
    }

    next.repayment_status = RepaymentStatus.PAID;
    next.paid_at = new Date();
    if (payrollId !== null) {
      next.payroll_id = payrollId;
    }

    await repo.save(next);

    this.logger.log(
      `Instalment ${next.installment_no} of loan #${next.request_id} ` +
        `paid - ${next.amount} deducted for user #${userId}`,
    );

    return Number(next.amount);
  }

  async findByLoan(requestId: number) {
    const instalments = await this.repaymentsRepository.find({
      where: { request_id: requestId },
      order: { installment_no: 'ASC' },
    });

    if (instalments.length === 0) {
      throw new NotFoundException(
        `No repayment schedule found for loan #${requestId}`,
      );
    }

    const summary = summariseLoan(instalments);

    return {
      request_id: requestId,
      ...summary,
      installments: instalments.map((i) => ({
        installment_no: i.installment_no,
        due_date: i.due_date,
        amount: Number(i.amount),
        repayment_status: i.repayment_status,
        paid_at: i.paid_at,
        payroll_id: i.payroll_id,
      })),
    };
  }

  async attachPayroll(
    manager: EntityManager,
    userId: number,
    payrollId: number,
  ): Promise<void> {
    const repo = manager.getRepository(LoanRepaymentEntity);

    const justPaid = await repo
      .createQueryBuilder('repayment')
      .innerJoin('repayment.request', 'request')
      .where('request.user_id = :userId', { userId })
      .andWhere('repayment.repayment_status = :status', {
        status: RepaymentStatus.PAID,
      })
      .andWhere('repayment.payroll_id IS NULL')
      .orderBy('repayment.paid_at', 'DESC')
      .getOne();

    if (justPaid) {
      justPaid.payroll_id = payrollId;
      await repo.save(justPaid);
    }
  }
}
