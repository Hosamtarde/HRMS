import {
  absenceDaysIn,
  dailyRateOf,
  isWeekend,
  monthBounds,
  netSalaryOf,
  payableWindow,
  roundMoney,
  totalDeductions,
} from './payroll.helper';

const utc = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day));

describe('payroll.helper', () => {
  describe('roundMoney', () => {
    it('rounds to two decimal places', () => {
      expect(roundMoney(1234.5678)).toBe(1234.57);
    });

    it('absorbs binary floating point drift', () => {
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    });

    it('leaves a whole amount alone', () => {
      expect(roundMoney(2500)).toBe(2500);
    });
  });

  describe('dailyRateOf', () => {
    it('divides the basic salary over a thirty day month', () => {
      expect(dailyRateOf(3000)).toBe(100);
    });

    it('accepts the decimal string MySQL returns', () => {
      expect(dailyRateOf('3000.00')).toBe(100);
    });
  });

  describe('totalDeductions', () => {
    it('adds the loan instalment to the day based deductions', () => {
      expect(
        totalDeductions({
          loanInstallment: 500,
          unpaidDays: 2,
          halfPaidDays: 4,
          absenceDays: 1,
          dailyRate: 100,
        }),
      ).toBe(1000);
    });

    it('charges a half paid leave day at half the daily rate', () => {
      expect(
        totalDeductions({
          loanInstallment: 0,
          unpaidDays: 0,
          halfPaidDays: 2,
          absenceDays: 0,
          dailyRate: 100,
        }),
      ).toBe(100);
    });

    it('deducts nothing from a clean month', () => {
      expect(
        totalDeductions({
          loanInstallment: 0,
          unpaidDays: 0,
          halfPaidDays: 0,
          absenceDays: 0,
          dailyRate: 100,
        }),
      ).toBe(0);
    });

    it('does not leak floating point drift from an indivisible salary', () => {
      expect(
        totalDeductions({
          loanInstallment: 0,
          unpaidDays: 3,
          halfPaidDays: 0,
          absenceDays: 0,
          dailyRate: dailyRateOf(1000),
        }),
      ).toBe(100);
    });
  });

  describe('netSalaryOf', () => {
    it('adds bonuses and subtracts deductions', () => {
      expect(netSalaryOf(3000, 250, 1000)).toBe(2250);
    });

    it('accepts the decimal strings MySQL returns', () => {
      expect(netSalaryOf('3000.00', '0.00', '125.50')).toBe(2874.5);
    });

    it('can go negative when deductions exceed the salary', () => {
      expect(netSalaryOf(1000, 0, 1500)).toBe(-500);
    });
  });

  describe('monthBounds', () => {
    it('ends a common year February on the 28th', () => {
      expect(monthBounds('2026-02').end.getUTCDate()).toBe(28);
    });

    it('ends a leap year February on the 29th', () => {
      expect(monthBounds('2028-02').end.getUTCDate()).toBe(29);
    });
  });

  describe('isWeekend', () => {
    it('treats Friday as a weekend day', () => {
      expect(isWeekend(utc(2026, 5, 1))).toBe(true);
    });

    it('treats Sunday as a working day', () => {
      expect(isWeekend(utc(2026, 5, 3))).toBe(false);
    });
  });

  describe('payableWindow', () => {
    it('spans a whole month that has already ended', () => {
      const window = payableWindow('2026-01', '2020-01-01', utc(2026, 5, 10));
      expect(window?.firstDay.getUTCDate()).toBe(1);
      expect(window?.lastDay.getUTCDate()).toBe(31);
    });

    it('stops at today for the month in progress', () => {
      const window = payableWindow('2026-05', '2020-01-01', utc(2026, 5, 10));
      expect(window?.lastDay.getUTCDate()).toBe(10);
    });

    it('starts at the hire date for an employee hired mid month', () => {
      const window = payableWindow('2026-05', '2026-05-06', utc(2026, 5, 10));
      expect(window?.firstDay.getUTCDate()).toBe(6);
    });

    it('is empty for a month that ended before the employee was hired', () => {
      expect(
        payableWindow('2026-01', '2026-03-01', utc(2026, 5, 10)),
      ).toBeNull();
    });

    it('is empty for a month that has not started yet', () => {
      expect(
        payableWindow('2026-12', '2020-01-01', utc(2026, 5, 10)),
      ).toBeNull();
    });
  });

  describe('absenceDaysIn', () => {
    const base = {
      salaryMonth: '2026-05',
      hireDate: '2020-01-01',
      today: utc(2026, 5, 10),
    };

    it('counts every working day as absent when nothing was recorded', () => {
      expect(
        absenceDaysIn({ ...base, attended: new Set(), onLeave: new Set() }),
      ).toBe(6);
    });

    it('does not count Fridays and Saturdays', () => {
      const allDays = absenceDaysIn({
        ...base,
        attended: new Set(),
        onLeave: new Set(),
      });
      expect(allDays).toBeLessThan(10);
    });

    it('subtracts the days that were attended', () => {
      expect(
        absenceDaysIn({
          ...base,
          attended: new Set(['2026-05-03', '2026-05-04']),
          onLeave: new Set(),
        }),
      ).toBe(4);
    });

    it('treats an approved leave day as present', () => {
      expect(
        absenceDaysIn({
          ...base,
          attended: new Set(['2026-05-03', '2026-05-04']),
          onLeave: new Set(['2026-05-05']),
        }),
      ).toBe(3);
    });

    it('does not charge an employee for days before they were hired', () => {
      expect(
        absenceDaysIn({
          ...base,
          hireDate: '2026-05-06',
          attended: new Set(),
          onLeave: new Set(),
        }),
      ).toBe(3);
    });

    it('charges nothing for a month that has not started', () => {
      expect(
        absenceDaysIn({
          ...base,
          salaryMonth: '2026-12',
          attended: new Set(),
          onLeave: new Set(),
        }),
      ).toBe(0);
    });
  });
});
