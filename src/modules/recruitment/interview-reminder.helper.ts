export const REMINDER_LEAD_MINUTES = 60;

const MINUTE_MS = 60_000;

export interface InterviewReminderEvent {
  applicationId: number;
  applicantName: string;
  email: string;
  position: string;
  interviewAt: Date;
  meetingUrl: string;
}

export interface ReminderSource {
  application_id: number;
  applicant_name: string;
  email: string;
  applied_position: string;
  interview_at: Date | null;
  meeting_url: string | null;
}

export interface ReminderWindow {
  from: Date;
  to: Date;
}

export function getReminderWindow(
  now: Date,
  leadMinutes: number = REMINDER_LEAD_MINUTES,
): ReminderWindow {
  return {
    from: now,
    to: new Date(now.getTime() + leadMinutes * MINUTE_MS),
  };
}

export function isWithinReminderWindow(
  interviewAt: Date,
  now: Date,
  leadMinutes: number = REMINDER_LEAD_MINUTES,
): boolean {
  return (
    interviewAt.getTime() <= getReminderWindow(now, leadMinutes).to.getTime()
  );
}

export function buildReminderEvent(
  source: ReminderSource,
): InterviewReminderEvent | null {
  if (!source.interview_at || !source.meeting_url) {
    return null;
  }
  return {
    applicationId: source.application_id,
    applicantName: source.applicant_name,
    email: source.email,
    position: source.applied_position,
    interviewAt: source.interview_at,
    meetingUrl: source.meeting_url,
  };
}
