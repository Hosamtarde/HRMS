import { PlanStatus, ReviewStatus, Role } from '../../../common/enums/enums';
import {
  reviewerDenialReason,
  reviewVisibilityDenial,
  scoreTotals,
  submissionWindowDenial,
  validateScores,
} from './review-rules.helper';

const criterion = (
  id: number,
  maxScore: number,
  weight: number | string,
  text = `criterion ${id}`,
) => ({
  criteria_id: id,
  criteria_text: text,
  max_score: maxScore,
  weight,
});

const CRITERIA = [criterion(1, 10, 60), criterion(2, 5, 40)];

const EMPLOYEE = 20;
const DEPARTMENT_MANAGER = 30;
const OTHER_MANAGER = 40;
const HR = 1;

describe('review-rules.helper', () => {
  describe('validateScores', () => {
    it('accepts a complete set of scores', () => {
      const result = validateScores(CRITERIA, [
        { criteria_id: 1, score: 8 },
        { criteria_id: 2, score: 5 },
      ]);

      expect(result.ok).toBe(true);
      expect(result.ok && result.matched).toHaveLength(2);
    });

    it('accepts a score that equals the maximum', () => {
      const result = validateScores(
        [criterion(1, 10, 100)],
        [{ criteria_id: 1, score: 10 }],
      );

      expect(result.ok).toBe(true);
    });

    it('rejects a criterion from another plan', () => {
      const result = validateScores(CRITERIA, [
        { criteria_id: 1, score: 8 },
        { criteria_id: 99, score: 3 },
      ]);

      expect(result).toMatchObject({
        ok: false,
        reason: 'unknown_criterion',
        criteriaId: 99,
      });
    });

    it('rejects the same criterion scored twice', () => {
      const result = validateScores(CRITERIA, [
        { criteria_id: 1, score: 8 },
        { criteria_id: 1, score: 9 },
      ]);

      expect(result).toMatchObject({
        ok: false,
        reason: 'duplicate_criterion',
        criteriaId: 1,
      });
    });

    it('rejects a score above the maximum', () => {
      const result = validateScores(CRITERIA, [{ criteria_id: 1, score: 11 }]);

      expect(result).toMatchObject({
        ok: false,
        reason: 'score_above_max',
        score: 11,
        maxScore: 10,
      });
    });

    it('rejects a partial submission and names what is missing', () => {
      const result = validateScores(CRITERIA, [{ criteria_id: 1, score: 8 }]);

      expect(result).toMatchObject({
        ok: false,
        reason: 'missing_criteria',
        labels: ['criterion 2'],
      });
    });
  });

  describe('scoreTotals', () => {
    it('sums the raw scores and weights the percentage', () => {
      expect(
        scoreTotals([
          {
            criterion: criterion(1, 10, 60),
            item: { criteria_id: 1, score: 8 },
          },
          {
            criterion: criterion(2, 5, 40),
            item: { criteria_id: 2, score: 5 },
          },
        ]),
      ).toEqual({ totalScore: 13, percentage: 88 });
    });

    it('reaches one hundred percent on a perfect review', () => {
      expect(
        scoreTotals([
          {
            criterion: criterion(1, 10, 60),
            item: { criteria_id: 1, score: 10 },
          },
          {
            criterion: criterion(2, 5, 40),
            item: { criteria_id: 2, score: 5 },
          },
        ]).percentage,
      ).toBe(100);
    });

    it('reaches zero percent when nothing was scored', () => {
      expect(
        scoreTotals([
          {
            criterion: criterion(1, 10, 100),
            item: { criteria_id: 1, score: 0 },
          },
        ]).percentage,
      ).toBe(0);
    });

    it('accepts the decimal string MySQL returns for the weight', () => {
      expect(
        scoreTotals([
          {
            criterion: criterion(1, 10, '100.00'),
            item: { criteria_id: 1, score: 5 },
          },
        ]).percentage,
      ).toBe(50);
    });

    it('rounds the percentage to two decimal places', () => {
      expect(
        scoreTotals([
          {
            criterion: criterion(1, 3, 100),
            item: { criteria_id: 1, score: 1 },
          },
        ]).percentage,
      ).toBe(33.33);
    });
  });

  describe('submissionWindowDenial', () => {
    const plan = {
      plan_status: PlanStatus.ACTIVE,
      submission_start: '2026-05-01',
      submission_end: '2026-05-31',
    };

    it('refuses a plan that is not active', () => {
      expect(
        submissionWindowDenial(
          { ...plan, plan_status: PlanStatus.DRAFT },
          '2026-05-10',
        ),
      ).toBe('plan_not_active');
    });

    it('refuses a submission before the window opens', () => {
      expect(submissionWindowDenial(plan, '2026-04-30')).toBe('not_open_yet');
    });

    it('refuses a submission after the window closes', () => {
      expect(submissionWindowDenial(plan, '2026-06-01')).toBe('closed');
    });

    it('accepts a submission on the opening day', () => {
      expect(submissionWindowDenial(plan, '2026-05-01')).toBeNull();
    });

    it('accepts a submission on the closing day', () => {
      expect(submissionWindowDenial(plan, '2026-05-31')).toBeNull();
    });
  });

  describe('reviewerDenialReason', () => {
    it('lets HR review a department manager', () => {
      expect(
        reviewerDenialReason({
          reviewerRole: Role.HR_ADMIN,
          reviewerId: HR,
          reviewedUserId: DEPARTMENT_MANAGER,
          departmentManagerId: DEPARTMENT_MANAGER,
        }),
      ).toBeNull();
    });

    it('stops a department manager reviewing themselves', () => {
      expect(
        reviewerDenialReason({
          reviewerRole: Role.MANAGER,
          reviewerId: DEPARTMENT_MANAGER,
          reviewedUserId: DEPARTMENT_MANAGER,
          departmentManagerId: DEPARTMENT_MANAGER,
        }),
      ).toBe('manager_reviews_self');
    });

    it('lets HR review an ordinary employee', () => {
      expect(
        reviewerDenialReason({
          reviewerRole: Role.HR_ADMIN,
          reviewerId: HR,
          reviewedUserId: EMPLOYEE,
          departmentManagerId: DEPARTMENT_MANAGER,
        }),
      ).toBeNull();
    });

    it('lets the department manager review their own employee', () => {
      expect(
        reviewerDenialReason({
          reviewerRole: Role.MANAGER,
          reviewerId: DEPARTMENT_MANAGER,
          reviewedUserId: EMPLOYEE,
          departmentManagerId: DEPARTMENT_MANAGER,
        }),
      ).toBeNull();
    });

    it('stops a manager from another department', () => {
      expect(
        reviewerDenialReason({
          reviewerRole: Role.MANAGER,
          reviewerId: OTHER_MANAGER,
          reviewedUserId: EMPLOYEE,
          departmentManagerId: DEPARTMENT_MANAGER,
        }),
      ).toBe('not_your_department');
    });

    it('leaves an employee with no department manager to HR', () => {
      expect(
        reviewerDenialReason({
          reviewerRole: Role.MANAGER,
          reviewerId: OTHER_MANAGER,
          reviewedUserId: EMPLOYEE,
          departmentManagerId: null,
        }),
      ).toBe('no_department_manager');
    });
  });

  describe('reviewVisibilityDenial', () => {
    const submitted = {
      reviewed_user_id: EMPLOYEE,
      review_status: ReviewStatus.SUBMITTED,
    };
    const pending = {
      reviewed_user_id: EMPLOYEE,
      review_status: ReviewStatus.PENDING,
    };

    it('lets HR read any review', () => {
      expect(
        reviewVisibilityDenial(
          pending,
          { user_id: HR, role: Role.HR_ADMIN },
          false,
        ),
      ).toBeNull();
    });

    it('lets an employee read their own submitted review', () => {
      expect(
        reviewVisibilityDenial(
          submitted,
          { user_id: EMPLOYEE, role: Role.EMPLOYEE },
          false,
        ),
      ).toBeNull();
    });

    it('hides an employee own review while it is still pending', () => {
      expect(
        reviewVisibilityDenial(
          pending,
          { user_id: EMPLOYEE, role: Role.EMPLOYEE },
          false,
        ),
      ).toBe('not_submitted_yet');
    });

    it('lets the managing manager read a pending review', () => {
      expect(
        reviewVisibilityDenial(
          pending,
          { user_id: DEPARTMENT_MANAGER, role: Role.MANAGER },
          true,
        ),
      ).toBeNull();
    });

    it('refuses a manager who does not manage the employee', () => {
      expect(
        reviewVisibilityDenial(
          submitted,
          { user_id: OTHER_MANAGER, role: Role.MANAGER },
          false,
        ),
      ).toBe('not_yours');
    });

    it('refuses a colleague', () => {
      expect(
        reviewVisibilityDenial(
          submitted,
          { user_id: 99, role: Role.EMPLOYEE },
          false,
        ),
      ).toBe('not_yours');
    });
  });
});
