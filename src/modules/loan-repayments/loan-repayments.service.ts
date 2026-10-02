import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LoanRepaymentEntity } from './loan-repayment.entity';
import { RequestEntity } from '../requests/request.entity';
import { RepaymentStatus } from '../../common/enums/enums';

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

    const loanAmount = Number(request.loan_amount);
    const periods = Number(request.repayment_period);

    const baseInstallment = Math.round((loanAmount / periods) * 100) / 100;

    const rows: LoanRepaymentEntity[] = [];
    let allocated = 0;

    for (let i = 1; i <= periods; i++) {
      const isLast = i === periods;
      const amount = isLast
        ? Math.round((loanAmount - allocated) * 100) / 100
        : baseInstallment;

      allocated += amount;

      rows.push(
        repo.create({
          request_id: request.request_id,
          installment_no: i,
          due_date: this.endOfMonthAfter(i),
          amount,
          repayment_status: RepaymentStatus.PENDING,
        }),
      );
    }

    await repo.save(rows);

    this.logger.log(
      `Generated ${periods} instalments for loan #${request.request_id} ` +
        `— ${loanAmount} total, ${baseInstallment} a month`,
    );
  }

  private endOfMonthAfter(n: number): string {
    const now = new Date();
    const target = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + n + 1, 0),
    );
    return target.toISOString().slice(0, 10);
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
        `paid — ${next.amount} deducted for user #${userId}`,
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

    const paid = instalments.filter(
      (i) => i.repayment_status === RepaymentStatus.PAID,
    );

    const loanAmount = instalments.reduce((sum, i) => sum + Number(i.amount), 0);
    const paidAmount = paid.reduce((sum, i) => sum + Number(i.amount), 0);

    const nextDue = instalments.find(
      (i) => i.repayment_status === RepaymentStatus.PENDING,

      
    );
    
    

    return {
      request_id: requestId,
      loan_amount: Math.round(loanAmount * 100) / 100,
      installments_total: instalments.length,
      installments_paid: paid.length,
      paid_amount: Math.round(paidAmount * 100) / 100,
      remaining_amount: Math.round((loanAmount - paidAmount) * 100) / 100,
      is_settled: paid.length === instalments.length,
      next_due_date: nextDue ? nextDue.due_date : null,
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