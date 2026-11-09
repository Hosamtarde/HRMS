import { RepaymentStatus } from '../../common/enums/enums';
import { roundMoney } from '../../common/utils/money.util';

export interface ScheduledInstallment {
  installment_no: number;
  due_date: string;
  amount: number;
}

export interface InstallmentRow {
  installment_no: number;
  due_date: string | Date;
  amount: number | string;
  repayment_status: RepaymentStatus;
}

export interface LoanSummary {
  loan_amount: number;
  installments_total: number;
  installments_paid: number;
  paid_amount: number;
  remaining_amount: number;
  is_settled: boolean;
  next_due_date: string | Date | null;
}

export function endOfMonthAfter(n: number, from: Date): string {
  const target = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + n + 1, 0),
  );
  return target.toISOString().slice(0, 10);
}

export function buildSchedule(
  loanAmount: number | string,
  periods: number | string,
  from: Date,
): ScheduledInstallment[] {
  const total = Number(loanAmount);
  const count = Number(periods);
  const base = roundMoney(total / count);

  const rows: ScheduledInstallment[] = [];
  let allocated = 0;

  for (let i = 1; i <= count; i++) {
    const isLast = i === count;
    const amount = isLast ? roundMoney(total - allocated) : base;

    allocated += amount;

    rows.push({
      installment_no: i,
      due_date: endOfMonthAfter(i, from),
      amount,
    });
  }

  return rows;
}

export function summariseLoan(instalments: InstallmentRow[]): LoanSummary {
  const paid = instalments.filter(
    (i) => i.repayment_status === RepaymentStatus.PAID,
  );

  const loanAmount = instalments.reduce((sum, i) => sum + Number(i.amount), 0);
  const paidAmount = paid.reduce((sum, i) => sum + Number(i.amount), 0);

  const nextDue = instalments.find(
    (i) => i.repayment_status === RepaymentStatus.PENDING,
  );

  return {
    loan_amount: roundMoney(loanAmount),
    installments_total: instalments.length,
    installments_paid: paid.length,
    paid_amount: roundMoney(paidAmount),
    remaining_amount: roundMoney(loanAmount - paidAmount),
    is_settled: instalments.length > 0 && paid.length === instalments.length,
    next_due_date: nextDue ? nextDue.due_date : null,
  };
}
