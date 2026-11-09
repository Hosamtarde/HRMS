import { AttendanceStatus, Role } from '../../common/enums/enums';

export const WORK_START_TIME = '08:00:00';
export const GRACE_MINUTES = 15;

export interface AttendanceAccessFacts {
  role: Role;
  actorId: number;
  targetId: number;
  isInScope: boolean;
}

export function toSeconds(time: string): number {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + (seconds || 0);
}

export function determineStatus(checkInTime: string): AttendanceStatus {
  const allowedSeconds = toSeconds(WORK_START_TIME) + GRACE_MINUTES * 60;

  return toSeconds(checkInTime) > allowedSeconds
    ? AttendanceStatus.LATE
    : AttendanceStatus.PRESENT;
}

export function workingHoursBetween(
  checkInTime: string,
  checkOutTime: string,
): number {
  const elapsed = toSeconds(checkOutTime) - toSeconds(checkInTime);

  if (elapsed <= 0) {
    return 0;
  }

  return Number((elapsed / 3600).toFixed(2));
}

export function monthRange(salaryMonth: string): {
  start: string;
  end: string;
} {
  const [yearStr, monthStr] = salaryMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;

  return {
    start: new Date(Date.UTC(year, month, 1)).toISOString().split('T')[0],
    end: new Date(Date.UTC(year, month + 1, 0)).toISOString().split('T')[0],
  };
}

export function canViewEmployeeAttendance(
  facts: AttendanceAccessFacts,
): boolean {
  const { role, actorId, targetId, isInScope } = facts;

  if (role === Role.HR_ADMIN) {
    return true;
  }
  if (actorId === targetId) {
    return true;
  }
  return role === Role.MANAGER && isInScope;
}
