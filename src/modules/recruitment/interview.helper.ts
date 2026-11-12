import { randomBytes } from 'crypto';
import { RecruitmentStatus } from '../../common/enums/enums';

export interface InterviewScheduledEvent {
  applicationId: number;
  applicantName: string;
  email: string;
  position: string;
  interviewAt: Date;
  meetingUrl: string;
  rescheduled: boolean;
}

export function canScheduleInterview(status: RecruitmentStatus): boolean {
  return (
    status === RecruitmentStatus.SHORTLISTED ||
    status === RecruitmentStatus.INTERVIEW_SCHEDULED
  );
}

export function isFutureInterviewTime(
  interviewAt: Date,
  now: Date = new Date(),
): boolean {
  return interviewAt.getTime() > now.getTime();
}

export function buildMeetingRoomName(
  applicationId: number,
  suffix: string = randomBytes(8).toString('hex'),
): string {
  return `nexushr-${applicationId}-${suffix}`;
}

export function buildMeetingUrl(baseUrl: string, roomName: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return `${withProtocol}/${roomName}`;
}
