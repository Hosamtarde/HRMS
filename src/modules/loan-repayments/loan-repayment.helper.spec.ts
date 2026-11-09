import { RepaymentStatus } from '../../common/enums/enums';
import {
  buildSchedule,
  endOfMonthAfter,
  InstallmentRow,
  summariseLoan,
} from './loan-repayment.helper';

const utc = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day));

const row = (
  no: number,
  amount: number | string,
  status: RepaymentStatus,
): InstallmentRow => ({
  installment_no: no,
  due_date: `2026-0${no + 5}-30`,
  amount,
  repayment_status: status,
});

describe('loan-repayment.helper', () => {
  describe('endOfMonthAfter', () => {
    it('lands on the last day of the following month', () => {
      expect(endOfMonthAfter(1, utc(2026, 5, 15))).toBe('2026-06-30');
    });

    it('walks forward one month per instalment', () => {
      expect(endOfMonthAfter(2, utc(2026, 5, 15))).toBe('2026-07-31');
    });

    it('crosses into the next year', () => {
      expect(endOfMonthAfter(1, utc(2026, 12, 10))).toBe('2027-01-31');
    });

    it('lands on 29 February in a leap year', () => {
      expect(endOfMonthAfter(1, utc(2028, 1, 10))).toBe('2028-02-29');
    });
  });

  describe('buildSchedule', () => {
    it('splits a loan that divides evenly', () => {
      const schedule = buildSchedule(1200, 12, utc(2026, 5, 15));
      expect(schedule).toHaveLength(12);
      expect(schedule.every((i) => i.amount === 100)).toBe(true);
    });

    it('puts the rounding remainder on the last instalment', () => {
      const schedule = buildSchedule(1000, 3, utc(2026, 5, 15));
      expect(schedule.map((i) => i.amount)).toEqual([333.33, 333.33, 333.34]);
    });

    it('never loses or invents money', () => {
      const schedule = buildSchedule(1000, 3, utc(2026, 5, 15));
      const sum = schedule.reduce((total, i) => total + i.amount, 0);
      expect(Math.round(sum * 100) / 100).toBe(1000);
    });

    it('handles a loan repaid in a single instalment', () => {
      const schedule = buildSchedule(750, 1, utc(2026, 5, 15));
      expect(schedule).toEqual([
        { installment_no: 1, due_date: '2026-06-30', amount: 750 },
      ]);
    });

    it('numbers the instalments from one upwards', () => {
      const schedule = buildSchedule(600, 6, utc(2026, 5, 15));
      expect(schedule.map((i) => i.installment_no)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('accepts the decimal strings MySQL returns', () => {
      const schedule = buildSchedule('900.00', '3', utc(2026, 5, 15));
      expect(schedule.map((i) => i.amount)).toEqual([300, 300, 300]);
    });

    it('spreads the due dates across consecutive months', () => {
      const schedule = buildSchedule(300, 3, utc(2026, 5, 15));
      expect(schedule.map((i) => i.due_date)).toEqual([
        '2026-06-30',
        '2026-07-31',
        '2026-08-31',
      ]);
    });
  });

  describe('summariseLoan', () => {
    it('reports a fresh loan as fully outstanding', () => {
      const summary = summariseLoan([
        row(1, 100, RepaymentStatus.PENDING),
        row(2, 100, RepaymentStatus.PENDING),
        row(3, 100, RepaymentStatus.PENDING),
      ]);

      expect(summary.loan_amount).toBe(300);
      expect(summary.paid_amount).toBe(0);
      expect(summary.remaining_amount).toBe(300);
      expect(summary.installments_paid).toBe(0);
      expect(summary.is_settled).toBe(false);
    });

    it('points at the first unpaid instalment as the next due', () => {
      const summary = summariseLoan([
        row(1, 100, RepaymentStatus.PAID),
        row(2, 100, RepaymentStatus.PENDING),
        row(3, 100, RepaymentStatus.PENDING),
      ]);

      expect(summary.next_due_date).toBe('2026-07-30');
      expect(summary.paid_amount).toBe(100);
      expect(summary.remaining_amount).toBe(200);
    });

    it('marks a loan settled once every instalment is paid', () => {
      const summary = summariseLoan([
        row(1, 100, RepaymentStatus.PAID),
        row(2, 100, RepaymentStatus.PAID),
      ]);

      expect(summary.is_settled).toBe(true);
      expect(summary.remaining_amount).toBe(0);
      expect(summary.next_due_date).toBeNull();
    });

    it('does not call an empty schedule settled', () => {
      expect(summariseLoan([]).is_settled).toBe(false);
    });

    it('adds up the decimal strings MySQL returns', () => {
      const summary = summariseLoan([
        row(1, '333.33', RepaymentStatus.PAID),
        row(2, '333.33', RepaymentStatus.PENDING),
        row(3, '333.34', RepaymentStatus.PENDING),
      ]);

      expect(summary.loan_amount).toBe(1000);
      expect(summary.remaining_amount).toBe(666.67);
    });
  });
});
