
export const SERVICE_TIERS = [
  { minYears: 0, maxYears: 1, days: 14 },
  { minYears: 1, maxYears: 5, days: 21 },
  { minYears: 5, maxYears: Infinity, days: 26 },
] as const;

/** الحد الأقصى لما يُرحَّل من سنة إلى التي تليها */
export const CARRY_OVER_CAP = 10;

/** موظف عُيّن خلال السنة يأخذ رصيداً بالتناسب مع أشهر عمله */
export const PRORATE_FIRST_YEAR = true;