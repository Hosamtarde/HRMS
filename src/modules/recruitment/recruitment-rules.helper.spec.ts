import { RecruitmentStatus } from '../../common/enums/enums';
import {
  allowedNextStatuses,
  canTransition,
  isTerminalStatus,
  safeUploadName,
} from './recruitment-rules.helper';

describe('recruitment-rules.helper', () => {
  describe('allowedNextStatuses', () => {
    it('offers shortlisting or rejection to a new application', () => {
      expect(allowedNextStatuses(RecruitmentStatus.PENDING)).toEqual([
        RecruitmentStatus.SHORTLISTED,
        RecruitmentStatus.REJECTED,
      ]);
    });

    it('offers nothing once the applicant was accepted', () => {
      expect(allowedNextStatuses(RecruitmentStatus.ACCEPTED)).toEqual([]);
    });
  });

  describe('isTerminalStatus', () => {
    it('treats acceptance as final', () => {
      expect(isTerminalStatus(RecruitmentStatus.ACCEPTED)).toBe(true);
    });

    it('treats rejection as final', () => {
      expect(isTerminalStatus(RecruitmentStatus.REJECTED)).toBe(true);
    });

    it('does not treat a pending application as final', () => {
      expect(isTerminalStatus(RecruitmentStatus.PENDING)).toBe(false);
    });
  });

  describe('canTransition', () => {
    it('moves a new application to the shortlist', () => {
      expect(
        canTransition(RecruitmentStatus.PENDING, RecruitmentStatus.SHORTLISTED),
      ).toBe(true);
    });

    it('moves a shortlisted applicant to an interview', () => {
      expect(
        canTransition(
          RecruitmentStatus.SHORTLISTED,
          RecruitmentStatus.INTERVIEW_SCHEDULED,
        ),
      ).toBe(true);
    });

    it('accepts an applicant after the interview', () => {
      expect(
        canTransition(
          RecruitmentStatus.INTERVIEW_SCHEDULED,
          RecruitmentStatus.ACCEPTED,
        ),
      ).toBe(true);
    });

    it('allows rejection at any open stage', () => {
      expect(
        canTransition(RecruitmentStatus.PENDING, RecruitmentStatus.REJECTED),
      ).toBe(true);
      expect(
        canTransition(
          RecruitmentStatus.SHORTLISTED,
          RecruitmentStatus.REJECTED,
        ),
      ).toBe(true);
    });

    it('refuses to accept an applicant who was rejected', () => {
      expect(
        canTransition(RecruitmentStatus.REJECTED, RecruitmentStatus.ACCEPTED),
      ).toBe(false);
    });

    it('refuses to reopen an accepted applicant', () => {
      expect(
        canTransition(RecruitmentStatus.ACCEPTED, RecruitmentStatus.PENDING),
      ).toBe(false);
    });

    it('refuses to skip the interview stage', () => {
      expect(
        canTransition(RecruitmentStatus.PENDING, RecruitmentStatus.ACCEPTED),
      ).toBe(false);
    });

    it('refuses a move to the status already held', () => {
      expect(
        canTransition(RecruitmentStatus.PENDING, RecruitmentStatus.PENDING),
      ).toBe(false);
    });
  });

  describe('safeUploadName', () => {
    it('keeps a plain file name', () => {
      expect(safeUploadName('cv-1731.pdf')).toBe('cv-1731.pdf');
    });

    it('strips a directory prefix', () => {
      expect(safeUploadName('uploads/cv-1731.pdf')).toBe('cv-1731.pdf');
    });

    it('strips a traversal attempt', () => {
      expect(safeUploadName('../../etc/passwd')).toBe('passwd');
    });

    it('rejects a bare traversal segment', () => {
      expect(safeUploadName('..')).toBeNull();
    });

    it('treats a missing file as nothing to delete', () => {
      expect(safeUploadName(null)).toBeNull();
      expect(safeUploadName(undefined)).toBeNull();
      expect(safeUploadName('')).toBeNull();
    });
  });
});
