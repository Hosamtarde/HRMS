import { PaymentType, RequestStatus, Role } from '../../common/enums/enums';

export interface DateSpan {
  from: Date;
  to: Date;
}

export interface RequestAccessFacts {
  role: Role;
  actorId: number;
  ownerId: number;
  isInScope: boolean;
}

export type ReviewDenial = 'own_request' | 'out_of_scope' | null;

export function countLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86400000) + 1;
}

export function isValidLeaveRange(startDate: string, endDate: string): boolean {
  return new Date(endDate).getTime() >= new Date(startDate).getTime();
}

export function deductsFromBalance(paymentType?: PaymentType): boolean {
  return paymentType !== PaymentType.UNPAID;
}

export function isPending(status: RequestStatus): boolean {
  return status === RequestStatus.PENDING;
}

export function canAccessRequest(facts: RequestAccessFacts): boolean {
  const { role, actorId, ownerId, isInScope } = facts;

  if (role === Role.HR_ADMIN) {
    return true;
  }
  if (ownerId === actorId) {
    return true;
  }
  return role === Role.MANAGER && isInScope;
}

export function reviewDenialReason(facts: RequestAccessFacts): ReviewDenial {
  const { role, actorId, ownerId, isInScope } = facts;

  if (role === Role.HR_ADMIN) {
    return null;
  }
  if (ownerId === actorId) {
    return 'own_request';
  }
  return isInScope ? null : 'out_of_scope';
}

export function clampToMonth(
  startDate: string,
  endDate: string,
  salaryMonth: string,
): DateSpan | null {
  const [yearStr, monthStr] = salaryMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;

  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));

  const start = new Date(startDate);
  const end = new Date(endDate);

  const from = start > monthStart ? start : monthStart;
  const to = end < monthEnd ? end : monthEnd;

  if (to.getTime() < from.getTime()) {
    return null;
  }

  return { from, to };
}

export function daysInSpan(span: DateSpan): number {
  return Math.floor((span.to.getTime() - span.from.getTime()) / 86400000) + 1;
}

export function datesInSpan(span: DateSpan): string[] {
  const dates: string[] = [];

  for (let t = span.from.getTime(); t <= span.to.getTime(); t += 86400000) {
    dates.push(new Date(t).toISOString().split('T')[0]);
  }

  return dates;
}
