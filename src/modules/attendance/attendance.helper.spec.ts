import { AttendanceStatus, Role } from '../../common/enums/enums';
import {
  canViewEmployeeAttendance,
  determineStatus,
  monthRange,
  toSeconds,
  workingHoursBetween,
} from './attendance.helper';

const EMPLOYEE = 20;
const MANAGER_IN_CHARGE = 30;
const MANAGER_ELSEWHERE = 40;
const HR = 1;

describe('attendance.helper', () => {
  describe('toSeconds', () => {
    it('converts a full clock time', () => {
      expect(toSeconds('08:00:00')).toBe(28800);
    });

    it('keeps the seconds part', () => {
      expect(toSeconds('00:00:30')).toBe(30);
    });

    it('accepts a time written without seconds', () => {
      expect(toSeconds('08:30')).toBe(30600);
    });
  });

  describe('determineStatus', () => {
    it('counts an on time arrival as present', () => {
      expect(determineStatus('08:00:00')).toBe(AttendanceStatus.PRESENT);
    });

    it('counts an early arrival as present', () => {
      expect(determineStatus('07:45:00')).toBe(AttendanceStatus.PRESENT);
    });

    it('still counts the last second of the grace period as present', () => {
      expect(determineStatus('08:15:00')).toBe(AttendanceStatus.PRESENT);
    });

    it('counts one second past the grace period as late', () => {
      expect(determineStatus('08:15:01')).toBe(AttendanceStatus.LATE);
    });

    it('counts a clearly late arrival as late', () => {
      expect(determineStatus('09:00:00')).toBe(AttendanceStatus.LATE);
    });
  });

  describe('workingHoursBetween', () => {
    it('counts a full working day', () => {
      expect(workingHoursBetween('08:00:00', '16:00:00')).toBe(8);
    });

    it('counts a half hour as a decimal fraction', () => {
      expect(workingHoursBetween('08:00:00', '16:30:00')).toBe(8.5);
    });

    it('rounds to two decimal places', () => {
      expect(workingHoursBetween('09:00:00', '09:20:00')).toBe(0.33);
    });

    it('returns zero when check out matches check in', () => {
      expect(workingHoursBetween('08:00:00', '08:00:00')).toBe(0);
    });

    it('never returns negative hours', () => {
      expect(workingHoursBetween('16:00:00', '08:00:00')).toBe(0);
    });
  });

  describe('monthRange', () => {
    it('spans a thirty one day month', () => {
      expect(monthRange('2026-05')).toEqual({
        start: '2026-05-01',
        end: '2026-05-31',
      });
    });

    it('ends a common year February on the 28th', () => {
      expect(monthRange('2026-02').end).toBe('2026-02-28');
    });

    it('ends a leap year February on the 29th', () => {
      expect(monthRange('2028-02').end).toBe('2028-02-29');
    });

    it('does not spill into the next year in December', () => {
      expect(monthRange('2026-12').end).toBe('2026-12-31');
    });
  });

  describe('canViewEmployeeAttendance', () => {
    it('lets HR read any attendance record', () => {
      expect(
        canViewEmployeeAttendance({
          role: Role.HR_ADMIN,
          actorId: HR,
          targetId: EMPLOYEE,
          isInScope: false,
        }),
      ).toBe(true);
    });

    it('lets an employee read their own record', () => {
      expect(
        canViewEmployeeAttendance({
          role: Role.EMPLOYEE,
          actorId: EMPLOYEE,
          targetId: EMPLOYEE,
          isInScope: false,
        }),
      ).toBe(true);
    });

    it('lets a manager read a record from their own subtree', () => {
      expect(
        canViewEmployeeAttendance({
          role: Role.MANAGER,
          actorId: MANAGER_IN_CHARGE,
          targetId: EMPLOYEE,
          isInScope: true,
        }),
      ).toBe(true);
    });

    it('refuses a manager from another part of the organisation', () => {
      expect(
        canViewEmployeeAttendance({
          role: Role.MANAGER,
          actorId: MANAGER_ELSEWHERE,
          targetId: EMPLOYEE,
          isInScope: false,
        }),
      ).toBe(false);
    });

    it('refuses an employee reaching for a colleague record', () => {
      expect(
        canViewEmployeeAttendance({
          role: Role.EMPLOYEE,
          actorId: 99,
          targetId: EMPLOYEE,
          isInScope: false,
        }),
      ).toBe(false);
    });
  });
});
