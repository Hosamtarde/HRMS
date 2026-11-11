import {
  buildReminderEvent,
  getReminderWindow,
  REMINDER_LEAD_MINUTES,
  ReminderSource,
} from './interview-reminder.helper';

describe('interview reminder helper', () => {
  const now = new Date('2026-11-20T10:00:00.000Z');

  describe('getReminderWindow', () => {
    it('starts now and ends one hour later by default', () => {
      const window = getReminderWindow(now);
      expect(window.from.toISOString()).toBe('2026-11-20T10:00:00.000Z');
      expect(window.to.toISOString()).toBe('2026-11-20T11:00:00.000Z');
    });

    it('uses the lead time that is passed in', () => {
      const window = getReminderWindow(now, 15);
      expect(window.to.toISOString()).toBe('2026-11-20T10:15:00.000Z');
    });

    it('does not change the date it was given', () => {
      getReminderWindow(now);
      expect(now.toISOString()).toBe('2026-11-20T10:00:00.000Z');
    });

    it('keeps the default lead time at sixty minutes', () => {
      expect(REMINDER_LEAD_MINUTES).toBe(60);
    });
  });

  describe('buildReminderEvent', () => {
    const source: ReminderSource = {
      application_id: 7,
      applicant_name: 'Ahmad Khalil',
      email: 'ahmad@test.com',
      applied_position: 'Software Engineer',
      interview_at: new Date('2026-11-20T10:30:00.000Z'),
      meeting_url: 'https://meet.jit.si/nexushr-7-abc',
    };

    it('maps the application to a reminder event', () => {
      expect(buildReminderEvent(source)).toEqual({
        applicationId: 7,
        applicantName: 'Ahmad Khalil',
        email: 'ahmad@test.com',
        position: 'Software Engineer',
        interviewAt: new Date('2026-11-20T10:30:00.000Z'),
        meetingUrl: 'https://meet.jit.si/nexushr-7-abc',
      });
    });

    it('returns null when there is no interview time', () => {
      expect(buildReminderEvent({ ...source, interview_at: null })).toBeNull();
    });

    it('returns null when there is no meeting link', () => {
      expect(buildReminderEvent({ ...source, meeting_url: null })).toBeNull();
    });
  });
});
