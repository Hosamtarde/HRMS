import { PaymentType, RequestStatus, Role } from '../../common/enums/enums';
import {
  canAccessRequest,
  clampToMonth,
  countLeaveDays,
  datesInSpan,
  daysInSpan,
  deductsFromBalance,
  isPending,
  isValidLeaveRange,
  reviewDenialReason,
} from './request-rules.helper';

const OWNER = 20;
const MANAGER_IN_CHARGE = 30;
const MANAGER_ELSEWHERE = 40;
const HR = 1;

const iso = (date: Date): string => date.toISOString().slice(0, 10);

describe('request-rules.helper', () => {
  describe('countLeaveDays', () => {
    it('counts a single day leave as one day', () => {
      expect(countLeaveDays('2026-05-04', '2026-05-04')).toBe(1);
    });

    it('counts both end points of the range', () => {
      expect(countLeaveDays('2026-05-01', '2026-05-05')).toBe(5);
    });

    it('counts across a month boundary', () => {
      expect(countLeaveDays('2026-04-28', '2026-05-02')).toBe(5);
    });
  });

  describe('isValidLeaveRange', () => {
    it('accepts a range that ends after it starts', () => {
      expect(isValidLeaveRange('2026-05-01', '2026-05-05')).toBe(true);
    });

    it('accepts a single day range', () => {
      expect(isValidLeaveRange('2026-05-04', '2026-05-04')).toBe(true);
    });

    it('rejects a range that ends before it starts', () => {
      expect(isValidLeaveRange('2026-05-05', '2026-05-01')).toBe(false);
    });
  });

  describe('deductsFromBalance', () => {
    it('does not deduct for unpaid leave', () => {
      expect(deductsFromBalance(PaymentType.UNPAID)).toBe(false);
    });

    it('deducts for paid leave', () => {
      expect(deductsFromBalance(PaymentType.PAID)).toBe(true);
    });

    it('deducts for half paid leave', () => {
      expect(deductsFromBalance(PaymentType.HALF_PAID)).toBe(true);
    });
  });

  describe('isPending', () => {
    it('is true only while the request is pending', () => {
      expect(isPending(RequestStatus.PENDING)).toBe(true);
    });

    it('is false once the request was approved', () => {
      expect(isPending(RequestStatus.APPROVED)).toBe(false);
    });

    it('is false once the request was rejected', () => {
      expect(isPending(RequestStatus.REJECTED)).toBe(false);
    });
  });

  describe('canAccessRequest', () => {
    it('lets HR open any request', () => {
      expect(
        canAccessRequest({
          role: Role.HR_ADMIN,
          actorId: HR,
          ownerId: OWNER,
          isInScope: false,
        }),
      ).toBe(true);
    });

    it('lets an employee open their own request', () => {
      expect(
        canAccessRequest({
          role: Role.EMPLOYEE,
          actorId: OWNER,
          ownerId: OWNER,
          isInScope: false,
        }),
      ).toBe(true);
    });

    it('lets a manager open a request from their own subtree', () => {
      expect(
        canAccessRequest({
          role: Role.MANAGER,
          actorId: MANAGER_IN_CHARGE,
          ownerId: OWNER,
          isInScope: true,
        }),
      ).toBe(true);
    });

    it('refuses a manager from another part of the organisation', () => {
      expect(
        canAccessRequest({
          role: Role.MANAGER,
          actorId: MANAGER_ELSEWHERE,
          ownerId: OWNER,
          isInScope: false,
        }),
      ).toBe(false);
    });

    it('refuses an employee reaching for a colleague request', () => {
      expect(
        canAccessRequest({
          role: Role.EMPLOYEE,
          actorId: 99,
          ownerId: OWNER,
          isInScope: false,
        }),
      ).toBe(false);
    });
  });

  describe('reviewDenialReason', () => {
    it('allows HR to review anything', () => {
      expect(
        reviewDenialReason({
          role: Role.HR_ADMIN,
          actorId: HR,
          ownerId: OWNER,
          isInScope: false,
        }),
      ).toBeNull();
    });

    it('allows a manager to review a request from their subtree', () => {
      expect(
        reviewDenialReason({
          role: Role.MANAGER,
          actorId: MANAGER_IN_CHARGE,
          ownerId: OWNER,
          isInScope: true,
        }),
      ).toBeNull();
    });

    it('stops a manager reviewing their own request', () => {
      expect(
        reviewDenialReason({
          role: Role.MANAGER,
          actorId: MANAGER_IN_CHARGE,
          ownerId: MANAGER_IN_CHARGE,
          isInScope: true,
        }),
      ).toBe('own_request');
    });

    it('stops a manager reviewing outside their subtree', () => {
      expect(
        reviewDenialReason({
          role: Role.MANAGER,
          actorId: MANAGER_ELSEWHERE,
          ownerId: OWNER,
          isInScope: false,
        }),
      ).toBe('out_of_scope');
    });

    it('stops a plain employee reviewing anything', () => {
      expect(
        reviewDenialReason({
          role: Role.EMPLOYEE,
          actorId: 99,
          ownerId: OWNER,
          isInScope: false,
        }),
      ).toBe('out_of_scope');
    });
  });

  describe('clampToMonth', () => {
    it('keeps a leave that sits entirely inside the month', () => {
      const span = clampToMonth('2026-05-10', '2026-05-14', '2026-05');
      expect(iso(span!.from)).toBe('2026-05-10');
      expect(iso(span!.to)).toBe('2026-05-14');
    });

    it('clips a leave that started in the previous month', () => {
      const span = clampToMonth('2026-04-28', '2026-05-02', '2026-05');
      expect(iso(span!.from)).toBe('2026-05-01');
      expect(iso(span!.to)).toBe('2026-05-02');
    });

    it('clips a leave that runs into the next month', () => {
      const span = clampToMonth('2026-05-28', '2026-06-03', '2026-05');
      expect(iso(span!.from)).toBe('2026-05-28');
      expect(iso(span!.to)).toBe('2026-05-31');
    });

    it('is empty for a leave in a different month', () => {
      expect(clampToMonth('2026-03-01', '2026-03-10', '2026-05')).toBeNull();
    });
  });

  describe('daysInSpan', () => {
    it('counts both end points', () => {
      const span = clampToMonth('2026-05-01', '2026-05-03', '2026-05');
      expect(daysInSpan(span!)).toBe(3);
    });

    it('counts a one day span as one', () => {
      const span = clampToMonth('2026-05-07', '2026-05-07', '2026-05');
      expect(daysInSpan(span!)).toBe(1);
    });

    it('counts only the part of a leave that falls in the month', () => {
      const span = clampToMonth('2026-04-28', '2026-05-02', '2026-05');
      expect(daysInSpan(span!)).toBe(2);
    });
  });

  describe('datesInSpan', () => {
    it('lists every day in the span', () => {
      const span = clampToMonth('2026-05-01', '2026-05-03', '2026-05');
      expect(datesInSpan(span!)).toEqual([
        '2026-05-01',
        '2026-05-02',
        '2026-05-03',
      ]);
    });

    it('lists a single day span as one entry', () => {
      const span = clampToMonth('2026-05-07', '2026-05-07', '2026-05');
      expect(datesInSpan(span!)).toEqual(['2026-05-07']);
    });
  });
});
