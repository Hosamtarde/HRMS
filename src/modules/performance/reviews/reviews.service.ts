import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PerformanceReviewEntity } from './performance-review.entity';
import { EvaluationScoreEntity } from './evaluation-score.entity';
import { EvaluationPlanEntity } from '../plans/evaluation-plan.entity';
import { PlanCriterionEntity } from '../plans/plan-criterion.entity';
import { EmployeeProfileEntity } from '../../employees/employee-profile.entity';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { ScoreItemDto } from './dto/score-item.dto';
import { ReviewStatus, PlanStatus, Role } from '../../../common/enums/enums';
import { DepartmentEntity } from '../../departments/department.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import { UserEntity } from '../../users/user.entity';
import { getToday } from '../../../common/utils/date.util';
import {
  reviewerDenialReason,
  reviewVisibilityDenial,
  scoreTotals,
  ScoreValidation,
  submissionWindowDenial,
  validateScores,
} from './review-rules.helper';

interface Reviewer {
  user_id: number;
  role: Role;
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(PerformanceReviewEntity)
    private readonly reviewsRepository: Repository<PerformanceReviewEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async submit(
    reviewId: number,
    dto: SubmitReviewDto,
    reviewer: Reviewer,
  ): Promise<PerformanceReviewEntity> {
    const result = await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(PerformanceReviewEntity, {
        where: { review_id: reviewId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!review) {
        throw new NotFoundException(`Review #${reviewId} not found`);
      }

      await this.assertReviewerIsAllowed(
        manager,
        review.reviewed_user_id,
        reviewer,
      );

      if (review.review_status !== ReviewStatus.PENDING) {
        throw new BadRequestException(
          'This review has already been submitted. Ask HR to reopen it if a score needs changing.',
        );
      }

      const plan = await manager.findOne(EvaluationPlanEntity, {
        where: { plan_id: review.plan_id },
      });
      if (!plan) {
        throw new NotFoundException(
          `Evaluation plan #${review.plan_id} not found`,
        );
      }
      this.assertSubmissionWindowIsOpen(plan);

      const criteria = await manager.find(PlanCriterionEntity, {
        where: { plan_id: review.plan_id },
      });

      const validation = validateScores(criteria, dto.scores);

      if (!validation.ok) {
        throw new BadRequestException(this.scoreValidationMessage(validation));
      }

      const { totalScore, percentage } = scoreTotals(validation.matched);

      await manager.delete(EvaluationScoreEntity, { review_id: reviewId });
      await manager.save(
        validation.matched.map(({ item }) =>
          manager.create(EvaluationScoreEntity, {
            review_id: reviewId,
            criteria_id: item.criteria_id,
            score: item.score,
            note: item.note,
          }),
        ),
      );

      review.reviewed_by = reviewer.user_id;
      review.review_status = ReviewStatus.SUBMITTED;
      review.total_score = totalScore;
      review.final_percentage = percentage;
      review.submitted_at = new Date();
      if (dto.reviewer_comment !== undefined) {
        review.reviewer_comment = dto.reviewer_comment;
      }
      await manager.save(review);

      this.logger.log(
        `Review #${reviewId} submitted by user #${reviewer.user_id}: ` +
          `${totalScore} raw, ${percentage}%`,
      );

      return {
        reviewedUserId: review.reviewed_user_id,
        percentage: review.final_percentage,
        planName: plan.plan_name,
      };
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.REVIEW_SUBMITTED, {
      reviewId,
      planName: result.planName,
      reviewedUserId: result.reviewedUserId,
      percentage: result.percentage,
    });

    return this.findOne(reviewId);
  }

  async reopen(
    reviewId: number,
    hrUserId: number,
  ): Promise<PerformanceReviewEntity> {
    const result = await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(PerformanceReviewEntity, {
        where: { review_id: reviewId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!review) {
        throw new NotFoundException(`Review #${reviewId} not found`);
      }
      if (review.review_status !== ReviewStatus.SUBMITTED) {
        throw new BadRequestException(
          'This review has not been submitted, so there is nothing to reopen',
        );
      }

      const plan = await manager.findOne(EvaluationPlanEntity, {
        where: { plan_id: review.plan_id },
      });
      if (!plan) {
        throw new NotFoundException(
          `Evaluation plan #${review.plan_id} not found`,
        );
      }
      this.assertSubmissionWindowIsOpen(plan);

      const previousReviewer = review.reviewed_by;

      review.review_status = ReviewStatus.PENDING;
      review.reviewed_by = null as unknown as number;
      review.total_score = null as unknown as number;
      review.final_percentage = null as unknown as number;
      review.submitted_at = null as unknown as Date;
      await manager.save(review);

      this.logger.log(`Review #${reviewId} reopened by HR user #${hrUserId}`);

      return {
        reviewerId: previousReviewer,
        reviewedUserId: review.reviewed_user_id,
        planName: plan.plan_name,
      };
    });

    if (result.reviewerId) {
      const employeeName = await this.recipientNameOf(result.reviewedUserId);

      this.eventEmitter.emit(NOTIFICATION_EVENTS.REVIEW_REOPENED, {
        reviewId,
        planName: result.planName,
        reviewerId: result.reviewerId,
        employeeName,
      });
    }

    return this.findOne(reviewId);
  }

  async findOne(
    id: number,
    viewer?: Reviewer,
  ): Promise<PerformanceReviewEntity> {
    const review = await this.reviewsRepository.findOne({
      where: { review_id: id },
      relations: {
        plan: true,
        reviewedUser: true,
        reviewer: true,
        scores: { criterion: { category: true } },
      },
    });
    if (!review) {
      throw new NotFoundException(`Review #${id} not found`);
    }
    if (viewer) {
      await this.assertCanBeSeenBy(review, viewer);
    }
    return review;
  }

  async findPendingFor(reviewer: Reviewer): Promise<PerformanceReviewEntity[]> {
    const rows = await this.reviewsRepository.find({
      where: { review_status: ReviewStatus.PENDING },
      relations: { plan: true, reviewedUser: true },
      order: { plan_id: 'ASC', reviewed_user_id: 'ASC' },
    });

    if (reviewer.role === Role.HR_ADMIN) {
      return rows.filter((r) => r.plan?.plan_status === PlanStatus.ACTIVE);
    }

    const managed = await this.findUsersManagedBy(reviewer.user_id);
    return rows.filter(
      (r) =>
        r.plan?.plan_status === PlanStatus.ACTIVE &&
        managed.has(r.reviewed_user_id),
    );
  }

  async findMine(userId: number): Promise<PerformanceReviewEntity[]> {
    return this.reviewsRepository.find({
      where: {
        reviewed_user_id: userId,
        review_status: ReviewStatus.SUBMITTED,
      },
      relations: { plan: true, scores: { criterion: { category: true } } },
      order: { submitted_at: 'DESC' },
    });
  }

  async findForEmployee(
    userId: number,
    viewer: Reviewer,
  ): Promise<PerformanceReviewEntity[]> {
    if (viewer.role !== Role.HR_ADMIN) {
      const managed = await this.findUsersManagedBy(viewer.user_id);
      if (!managed.has(userId)) {
        throw new ForbiddenException(
          'You can only see the history of employees in the department you manage',
        );
      }
    }
    return this.reviewsRepository.find({
      where: {
        reviewed_user_id: userId,
        review_status: ReviewStatus.SUBMITTED,
      },
      relations: { plan: true },
      order: { submitted_at: 'DESC' },
    });
  }

  private async assertCanBeSeenBy(
    review: PerformanceReviewEntity,
    viewer: Reviewer,
  ): Promise<void> {
    const managesReviewedUser =
      viewer.role === Role.MANAGER && review.reviewed_user_id !== viewer.user_id
        ? (await this.findUsersManagedBy(viewer.user_id)).has(
            review.reviewed_user_id,
          )
        : false;

    const denial = reviewVisibilityDenial(review, viewer, managesReviewedUser);

    if (denial === 'not_submitted_yet') {
      throw new ForbiddenException('This review has not been submitted yet');
    }
    if (denial === 'not_yours') {
      throw new ForbiddenException('This review is not yours to read');
    }
  }

  private async findUsersManagedBy(managerId: number): Promise<Set<number>> {
    const rows = await this.dataSource
      .createQueryBuilder(EmployeeProfileEntity, 'profile')
      .innerJoin(
        DepartmentEntity,
        'department',
        'department.department_id = profile.department_id',
      )
      .select('profile.user_id', 'user_id')
      .where('department.manager_id = :managerId', { managerId })
      .andWhere('profile.user_id != :managerId', { managerId })
      .getRawMany<{ user_id: number }>();
    return new Set(rows.map((r) => r.user_id));
  }

  private async assertReviewerIsAllowed(
    manager: EntityManager,
    reviewedUserId: number,
    reviewer: Reviewer,
  ): Promise<void> {
    const profile = await manager.findOne(EmployeeProfileEntity, {
      where: { user_id: reviewedUserId },
      relations: { department: true },
    });

    const denial = reviewerDenialReason({
      reviewerRole: reviewer.role,
      reviewerId: reviewer.user_id,
      reviewedUserId,
      departmentManagerId: profile?.department?.manager_id ?? null,
    });

    if (denial === 'manager_reviews_self') {
      throw new ForbiddenException(
        'A department manager is reviewed by HR, not by themselves',
      );
    }
    if (denial === 'no_department_manager') {
      throw new ForbiddenException(
        'This employee has no department manager, so only HR can review them',
      );
    }
    if (denial === 'not_your_department') {
      throw new ForbiddenException(
        'You can only review employees in the department you manage',
      );
    }
  }

  private assertSubmissionWindowIsOpen(plan: EvaluationPlanEntity): void {
    const denial = submissionWindowDenial(plan, getToday());

    if (denial === 'plan_not_active') {
      throw new BadRequestException(
        `Reviews can only be submitted while the plan is active. This plan is ${plan.plan_status}.`,
      );
    }
    if (denial === 'not_open_yet') {
      throw new BadRequestException(
        `Submission for this plan opens on ${plan.submission_start}`,
      );
    }
    if (denial === 'closed') {
      throw new BadRequestException(
        `Submission for this plan closed on ${plan.submission_end}`,
      );
    }
  }

  private scoreValidationMessage(
    result: Extract<
      ScoreValidation<PlanCriterionEntity, ScoreItemDto>,
      { ok: false }
    >,
  ): string {
    switch (result.reason) {
      case 'unknown_criterion':
        return `Criterion #${result.criteriaId} does not belong to this plan`;
      case 'duplicate_criterion':
        return `Criterion #${result.criteriaId} was scored twice`;
      case 'score_above_max':
        return `Score ${result.score} is above the maximum of ${result.maxScore} for "${result.label}"`;
      case 'missing_criteria':
        return `Every criterion must be scored. Missing: ${result.labels.join(', ')}`;
    }
  }

  private async recipientNameOf(userId: number): Promise<string> {
    const user = await this.dataSource.getRepository(UserEntity).findOne({
      where: { user_id: userId },
      select: { first_name: true, last_name: true },
    });
    return user
      ? `${user.first_name} ${user.last_name}`
      : '\u0627\u0644\u0645\u0648\u0638\u0641';
  }
}
