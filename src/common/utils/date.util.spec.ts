import { getToday, nextDay } from './date.util';

describe('date.util', () => {
  describe('getToday', () => {
    it('returns a date in YYYY-MM-DD form', () => {
      expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns the current local date, not the UTC date', () => {
      const now = new Date();
      const expected = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-');
      expect(getToday()).toBe(expected);
    });
  });

  describe('nextDay', () => {
    it('advances a date by one day', () => {
      expect(nextDay('2026-03-14')).toBe('2026-03-15');
    });

    it('rolls over the end of a month', () => {
      expect(nextDay('2026-04-30')).toBe('2026-05-01');
    });

    it('rolls over the end of a year', () => {
      expect(nextDay('2026-12-31')).toBe('2027-01-01');
    });

    it('produces 29 February in a leap year', () => {
      expect(nextDay('2028-02-28')).toBe('2028-02-29');
    });

    it('skips 29 February in a common year', () => {
      expect(nextDay('2026-02-28')).toBe('2026-03-01');
    });

    it('keeps zero padding for single digit months and days', () => {
      expect(nextDay('2026-01-08')).toBe('2026-01-09');
    });
  });
});
