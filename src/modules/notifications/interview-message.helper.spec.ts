import { formatInterviewTime } from './interview-message.helper';

describe('formatInterviewTime', () => {
  const date = new Date('2026-11-20T09:30:00.000Z');

  it('formats the time in the Hebron time zone by default', () => {
    expect(formatInterviewTime(date)).toContain('11:30');
  });

  it('uses western digits for the year and day', () => {
    const text = formatInterviewTime(date);
    expect(text).toContain('2026');
    expect(text).toContain('20');
  });

  it('honours a custom time zone', () => {
    expect(formatInterviewTime(date, 'UTC')).toContain('09:30');
  });
});
