import {
  availableDays,
  carryOverOf,
  entitlementFor,
  yearsOfService,
} from './leave-balance.helper';

describe('leave-balance.helper', () => {
  describe('availableDays', () => {
    it('adds the carried over days to the entitlement and subtracts what was used', () => {
      expect(availableDays(21, 5, 4)).toBe(22);
    });

    it('handles the decimal strings MySQL returns for DECIMAL columns', () => {
      expect(availableDays('21.00', '0.00', '3.50')).toBe(17.5);
    });

    it('returns zero when the whole entitlement has been used', () => {
      expect(availableDays(14, 0, 14)).toBe(0);
    });
  });

  describe('yearsOfService', () => {
    it('measures service up to the end of the target year, not today', () => {
      expect(yearsOfService('2026-01-01', 2026)).toBeCloseTo(1, 1);
    });
  });

  describe('entitlementFor', () => {
    it('gives 14 days in the first year of service', () => {
      expect(entitlementFor('2026-01-01', 2026)).toBe(14);
    });

    it('gives 21 days between one and five years of service', () => {
      expect(entitlementFor('2023-01-01', 2026)).toBe(21);
    });

    it('gives 26 days beyond five years of service', () => {
      expect(entitlementFor('2019-01-01', 2026)).toBe(26);
    });

    it('does not prorate an employee hired in an earlier year', () => {
      expect(entitlementFor('2025-06-15', 2026)).toBe(21);
    });

    it('prorates an employee hired mid year', () => {
      expect(entitlementFor('2026-07-01', 2026)).toBe(7);
    });

    it('rounds a prorated entitlement to the nearest half day', () => {
      expect(entitlementFor('2026-10-01', 2026)).toBe(3.5);
    });

    it('still grants a full day to an employee hired in December', () => {
      expect(entitlementFor('2026-12-01', 2026)).toBe(1);
    });
  });

  describe('carryOverOf', () => {
    it('carries nothing when there is no previous year', () => {
      expect(carryOverOf(null)).toBe(0);
    });

    it('carries the full remainder when it is under the cap', () => {
      expect(carryOverOf(4)).toBe(4);
    });

    it('caps the carry over at ten days', () => {
      expect(carryOverOf(15)).toBe(10);
    });

    it('carries exactly the cap when the remainder equals it', () => {
      expect(carryOverOf(10)).toBe(10);
    });

    it('never carries a negative balance forward', () => {
      expect(carryOverOf(-3)).toBe(0);
    });
  });
});
