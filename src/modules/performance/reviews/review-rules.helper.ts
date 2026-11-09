import { PlanStatus, ReviewStatus, Role } from '../../../common/enums/enums';

export interface CriterionLike {
  criteria_id: number;
  criteria_text: string;
  max_score: number;
  weight: number | string;
}

export interface ScoreLike {
  criteria_id: number;
  score: number;
}

export type ScoreValidation<C, S> =
  | { ok: true; matched: { criterion: C; item: S }[] }
  | { ok: false; reason: 'unknown_criterion'; criteriaId: number }
  | { ok: false; reason: 'duplicate_criterion'; criteriaId: number }
  | {
      ok: false;
      reason: 'score_above_max';
      score: number;
      maxScore: number;
      label: string;
    }
  | { ok: false; reason: 'missing_criteria'; labels: string[] };

export type WindowDenial = 'plan_not_active' | 'not_open_yet' | 'closed' | null;

export type VisibilityDenial = 'not_submitted_yet' | 'not_yours' | null;

export type ReviewerDenial =
  | 'manager_reviews_self'
  | 'no_department_manager'
  | 'not_your_department'
  | null;

export interface ReviewerFacts {
  reviewerRole: Role;
  reviewerId: number;
  reviewedUserId: number;
  departmentManagerId: number | null;
}

export function validateScores<C extends CriterionLike, S extends ScoreLike>(
  criteria: C[],
  items: S[],
): ScoreValidation<C, S> {
  const byId = new Map(criteria.map((c) => [c.criteria_id, c]));
  const seen = new Set<number>();
  const matched: { criterion: C; item: S }[] = [];

  for (const item of items) {
    const criterion = byId.get(item.criteria_id);

    if (!criterion) {
      return {
        ok: false,
        reason: 'unknown_criterion',
        criteriaId: item.criteria_id,
      };
    }
    if (seen.has(item.criteria_id)) {
      return {
        ok: false,
        reason: 'duplicate_criterion',
        criteriaId: item.criteria_id,
      };
    }
    if (item.score > criterion.max_score) {
      return {
        ok: false,
        reason: 'score_above_max',
        score: item.score,
        maxScore: criterion.max_score,
        label: criterion.criteria_text,
      };
    }

    seen.add(item.criteria_id);
    matched.push({ criterion, item });
  }

  const missing = criteria.filter((c) => !seen.has(c.criteria_id));

  if (missing.length) {
    return {
      ok: false,
      reason: 'missing_criteria',
      labels: missing.map((c) => c.criteria_text),
    };
  }

  return { ok: true, matched };
}

export function scoreTotals(
  matched: { criterion: CriterionLike; item: ScoreLike }[],
): { totalScore: number; percentage: number } {
  let totalScore = 0;
  let percentage = 0;

  for (const { criterion, item } of matched) {
    totalScore += item.score;
    percentage += (item.score / criterion.max_score) * Number(criterion.weight);
  }

  return {
    totalScore: Number(totalScore.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
  };
}

export function submissionWindowDenial(
  plan: {
    plan_status: PlanStatus;
    submission_start: string;
    submission_end: string;
  },
  today: string,
): WindowDenial {
  if (plan.plan_status !== PlanStatus.ACTIVE) {
    return 'plan_not_active';
  }
  if (today < plan.submission_start) {
    return 'not_open_yet';
  }
  if (today > plan.submission_end) {
    return 'closed';
  }
  return null;
}

export function reviewerDenialReason(facts: ReviewerFacts): ReviewerDenial {
  const { reviewerRole, reviewerId, reviewedUserId, departmentManagerId } =
    facts;

  if (reviewedUserId === departmentManagerId) {
    return reviewerRole === Role.HR_ADMIN ? null : 'manager_reviews_self';
  }
  if (reviewerRole === Role.HR_ADMIN) {
    return null;
  }
  if (departmentManagerId === null) {
    return 'no_department_manager';
  }
  if (reviewerId !== departmentManagerId) {
    return 'not_your_department';
  }
  return null;
}

export function reviewVisibilityDenial(
  review: { reviewed_user_id: number; review_status: ReviewStatus },
  viewer: { user_id: number; role: Role },
  managesReviewedUser: boolean,
): VisibilityDenial {
  if (viewer.role === Role.HR_ADMIN) {
    return null;
  }
  if (review.reviewed_user_id === viewer.user_id) {
    return review.review_status === ReviewStatus.SUBMITTED
      ? null
      : 'not_submitted_yet';
  }
  if (viewer.role === Role.MANAGER && managesReviewedUser) {
    return null;
  }
  return 'not_yours';
}
