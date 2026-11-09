import {
  SERVICE_TIERS,
  CARRY_OVER_CAP,
  PRORATE_FIRST_YEAR,
} from './leave-balance.constants';

export function availableDays(
  totalDays: number | string,
  carriedOver: number | string,
  usedDays: number | string,
): number {
  return Number(totalDays) + Number(carriedOver) - Number(usedDays);
}

export function yearsOfService(hireDate: string, year: number): number {
  const hire = new Date(hireDate);
  const endOfYear = new Date(Date.UTC(year, 11, 31));
  const ms = endOfYear.getTime() - hire.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

export function entitlementFor(hireDate: string, year: number): number {
  const years = yearsOfService(hireDate, year);

  const tier = SERVICE_TIERS.find(
    (t) => years >= t.minYears && years < t.maxYears,
  );
  const fullDays = tier ? tier.days : SERVICE_TIERS[0].days;

  const hire = new Date(hireDate);
  const hiredThisYear = hire.getUTCFullYear() === year;

  if (!hiredThisYear || !PRORATE_FIRST_YEAR) {
    return fullDays;
  }

  const monthsWorked = 12 - hire.getUTCMonth();
  const prorated = (fullDays * monthsWorked) / 12;

  return Math.round(prorated * 2) / 2;
}

export function carryOverOf(previousAvailable: number | null): number {
  if (previousAvailable === null) {
    return 0;
  }

  return Math.max(0, Math.min(previousAvailable, CARRY_OVER_CAP));
}
