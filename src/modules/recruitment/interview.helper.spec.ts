import { RecruitmentStatus } from '../../common/enums/enums';
import {
  buildMeetingRoomName,
  buildMeetingUrl,
  canScheduleInterview,
  isFutureInterviewTime,
} from './interview.helper';

describe('canScheduleInterview', () => {
  it('allows a shortlisted or already scheduled application', () => {
    expect(canScheduleInterview(RecruitmentStatus.SHORTLISTED)).toBe(true);
    expect(canScheduleInterview(RecruitmentStatus.INTERVIEW_SCHEDULED)).toBe(
      true,
    );
  });

  it('rejects every other status', () => {
    expect(canScheduleInterview(RecruitmentStatus.PENDING)).toBe(false);
    expect(canScheduleInterview(RecruitmentStatus.ACCEPTED)).toBe(false);
    expect(canScheduleInterview(RecruitmentStatus.REJECTED)).toBe(false);
  });
});

describe('isFutureInterviewTime', () => {
  const now = new Date('2026-11-11T10:00:00.000Z');

  it('accepts a time after now', () => {
    expect(
      isFutureInterviewTime(new Date('2026-11-11T10:00:01.000Z'), now),
    ).toBe(true);
  });

  it('rejects a time before now', () => {
    expect(
      isFutureInterviewTime(new Date('2026-11-11T09:59:59.000Z'), now),
    ).toBe(false);
  });

  it('rejects a time equal to now', () => {
    expect(isFutureInterviewTime(new Date(now.getTime()), now)).toBe(false);
  });
});

describe('buildMeetingRoomName', () => {
  it('uses the given suffix', () => {
    expect(buildMeetingRoomName(12, 'abc')).toBe('nexushr-12-abc');
  });

  it('adds a random suffix by default', () => {
    const first = buildMeetingRoomName(12);
    const second = buildMeetingRoomName(12);
    expect(first).toMatch(/^nexushr-12-[0-9a-f]{16}$/);
    expect(first).not.toBe(second);
  });
});

describe('buildMeetingUrl', () => {
  it('joins the room to a base url with a protocol', () => {
    expect(buildMeetingUrl('https://meet.jit.si', 'room-1')).toBe(
      'https://meet.jit.si/room-1',
    );
  });

  it('adds https when the base url has no protocol', () => {
    expect(buildMeetingUrl('meet.jit.si', 'room-1')).toBe(
      'https://meet.jit.si/room-1',
    );
  });

  it('ignores a trailing slash on the base url', () => {
    expect(buildMeetingUrl('https://meet.jit.si/', 'room-1')).toBe(
      'https://meet.jit.si/room-1',
    );
  });
});
