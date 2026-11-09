import { basename } from 'path';
import { RecruitmentStatus } from '../../common/enums/enums';

const ALLOWED_NEXT: Record<RecruitmentStatus, RecruitmentStatus[]> = {
  [RecruitmentStatus.PENDING]: [
    RecruitmentStatus.SHORTLISTED,
    RecruitmentStatus.REJECTED,
  ],
  [RecruitmentStatus.SHORTLISTED]: [
    RecruitmentStatus.INTERVIEW_SCHEDULED,
    RecruitmentStatus.REJECTED,
  ],
  [RecruitmentStatus.INTERVIEW_SCHEDULED]: [
    RecruitmentStatus.ACCEPTED,
    RecruitmentStatus.REJECTED,
  ],
  [RecruitmentStatus.ACCEPTED]: [],
  [RecruitmentStatus.REJECTED]: [],
};

export function allowedNextStatuses(
  current: RecruitmentStatus,
): RecruitmentStatus[] {
  return ALLOWED_NEXT[current] ?? [];
}

export function isTerminalStatus(status: RecruitmentStatus): boolean {
  return allowedNextStatuses(status).length === 0;
}

export function canTransition(
  from: RecruitmentStatus,
  to: RecruitmentStatus,
): boolean {
  return allowedNextStatuses(from).includes(to);
}

export function safeUploadName(fileName?: string | null): string | null {
  if (!fileName) {
    return null;
  }

  const name = basename(fileName);

  if (name === '' || name === '.' || name === '..') {
    return null;
  }

  return name;
}
