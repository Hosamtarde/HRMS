import {
  DAYS_PER_SALARY_MONTH,
  HALF_PAID_DEDUCTION_RATE,
  WEEKEND_DAYS,
} from './payroll.constants';

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function dailyRateOf(basicSalary: number | string): number {
  return Number(basicSalary) / DAYS_PER_SALARY_MONTH;
}

export interface DeductionInput {
  loanInstallment: number;
  unpaidDays: number;
  halfPaidDays: number;
  absenceDays: number;
  dailyRate: number;
}

export function totalDeductions(input: DeductionInput): number {
  const { loanInstallment, unpaidDays, halfPaidDays, absenceDays, dailyRate } =
    input;

  return roundMoney(
    loanInstallment +
      unpaidDays * dailyRate +
      halfPaidDays * dailyRate * HALF_PAID_DEDUCTION_RATE +
      absenceDays * dailyRate,
  );
}

export function netSalaryOf(
  basicSalary: number | string,
  bonuses: number | string,
  deductions: number | string,
): number {
  return roundMoney(Number(basicSalary) + Number(bonuses) - Number(deductions));
}

export function monthBounds(salaryMonth: string): { start: Date; end: Date } {
  const [yearStr, monthStr] = salaryMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;

  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 0)),
  };
}

export function isWeekend(date: Date): boolean {
  return WEEKEND_DAYS.includes(date.getUTCDay());
}

export function payableWindow(
  salaryMonth: string,
  hireDate: string | Date,
  today: Date,
): { firstDay: Date; lastDay: Date } | null {
  const { start, end } = monthBounds(salaryMonth);

  const lastDay = end < today ? end : today;
  const hire = new Date(hireDate);
  const firstDay = hire > start ? hire : start;

  if (lastDay.getTime() < firstDay.getTime()) {
    return null;
  }

  return { firstDay, lastDay };
}

export interface AbsenceInput {
  salaryMonth: string;
  hireDate: string | Date;
  today: Date;
  attended: Set<string>;
  onLeave: Set<string>;
}

export function absenceDaysIn(input: AbsenceInput): number {
  const { salaryMonth, hireDate, today, attended, onLeave } = input;

  const window = payableWindow(salaryMonth, hireDate, today);
  if (!window) {
    return 0;
  }

  let absenceDays = 0;

  for (
    let t = window.firstDay.getTime();
    t <= window.lastDay.getTime();
    t += 86400000
  ) {
    const day = new Date(t);

    if (isWeekend(day)) {
      continue;
    }

    const iso = day.toISOString().split('T')[0];

    if (attended.has(iso) || onLeave.has(iso)) {
      continue;
    }

    absenceDays += 1;
  }

  return absenceDays;
}
