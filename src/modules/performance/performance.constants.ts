/** Default scale a criterion is scored on: 1 … 5. */
export const DEFAULT_MAX_SCORE = 5;

/** The weights of a plan's criteria must add up to exactly this. */
export const TOTAL_WEIGHT = 100;

/** Word for each point on the default scale, so the UI shows meaning, not a bare number. */
export const RATING_LABELS: Record<number, string> = {
  1: 'ضعيف',
  2: 'بحاجة إلى تحسين',
  3: 'مقبول',
  4: 'جيد',
  5: 'ممتاز',
};