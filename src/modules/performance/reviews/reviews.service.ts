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
        throw new NotFoundException(`Evaluation plan #${review.plan_id} not found`);
      }
      this.assertSubmissionWindowIsOpen(plan);

      const criteria = await manager.find(PlanCriterionEntity, {
        where: { plan_id: review.plan_id },
      });
      const matched = this.matchScoresToCriteria(criteria, dto.scores);

      let totalScore = 0;
      let percentage = 0;
      for (const { criterion, item } of matched) {
        totalScore += item.score;
        percentage += (item.score / criterion.max_score) * Number(criterion.weight);
      }

      await manager.delete(EvaluationScoreEntity, { review_id: reviewId });
      await manager.save(
        matched.map(({ item }) =>
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
      review.total_score = Number(totalScore.toFixed(2));
      review.final_percentage = Number(percentage.toFixed(2));
      review.submitted_at = new Date();
      if (dto.reviewer_comment !== undefined) {
        review.reviewer_comment = dto.reviewer_comment;
      }
      await manager.save(review);

      this.logger.log(
        `Review #${reviewId} submitted by user #${reviewer.user_id}: ` +
          `${totalScore} raw, ${review.final_percentage}%`,
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
        throw new NotFoundException(`Evaluation plan #${review.plan_id} not found`);
      }
      this.assertSubmissionWindowIsOpen(plan);

      const previousReviewer = review.reviewed_by;

      review.review_status = ReviewStatus.PENDING;
      review.reviewed_by = null as unknown as number;
      review.total_score = null as unknown as number;
      review.final_percentage = null as unknown as number;
      review.submitted_at = null as unknown as Date;
      await manager.save(review);

      this.logger.log(
        `Review #${reviewId} reopened by HR user #${hrUserId}`,
      );

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

  async findOne(id: number, viewer?: Reviewer): Promise<PerformanceReviewEntity> {
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
      where: { reviewed_user_id: userId, review_status: ReviewStatus.SUBMITTED },
      relations: { plan: true },
      order: { submitted_at: 'DESC' },
    });
  }

  private async assertCanBeSeenBy(
    review: PerformanceReviewEntity,
    viewer: Reviewer,
  ): Promise<void> {
    if (viewer.role === Role.HR_ADMIN) return;

    if (review.reviewed_user_id === viewer.user_id) {
      if (review.review_status !== ReviewStatus.SUBMITTED) {
        throw new ForbiddenException(
          'This review has not been submitted yet',
        );
      }
      return;
    }

    if (viewer.role === Role.MANAGER) {
      const managed = await this.findUsersManagedBy(viewer.user_id);
      if (managed.has(review.reviewed_user_id)) return;
    }

    throw new ForbiddenException('This review is not yours to read');
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

    const departmentManagerId = profile?.department?.manager_id ?? null;

    if (reviewedUserId === departmentManagerId) {
      if (reviewer.role !== Role.HR_ADMIN) {
        throw new ForbiddenException(
          'A department manager is reviewed by HR, not by themselves',
        );
      }
      return;
    }

    if (reviewer.role === Role.HR_ADMIN) return;

    if (departmentManagerId === null) {
      throw new ForbiddenException(
        'This employee has no department manager, so only HR can review them',
      );
    }

    if (reviewer.user_id !== departmentManagerId) {
      throw new ForbiddenException(
        'You can only review employees in the department you manage',
      );
    }
  }

  private assertSubmissionWindowIsOpen(plan: EvaluationPlanEntity): void {
    if (plan.plan_status !== PlanStatus.ACTIVE) {
      throw new BadRequestException(
        `Reviews can only be submitted while the plan is active. This plan is ${plan.plan_status}.`,
      );
    }
    const today = this.todayAsDateString();
    if (today < plan.submission_start) {
      throw new BadRequestException(
        `Submission for this plan opens on ${plan.submission_start}`,
      );
    }
    if (today > plan.submission_end) {
      throw new BadRequestException(
        `Submission for this plan closed on ${plan.submission_end}`,
      );
    }
  }

  private todayAsDateString(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private matchScoresToCriteria(
    criteria: PlanCriterionEntity[],
    items: ScoreItemDto[],
  ): Array<{ criterion: PlanCriterionEntity; item: ScoreItemDto }> {
    const byId = new Map(criteria.map((c) => [c.criteria_id, c]));
    const seen = new Set<number>();
    const matched: Array<{
      criterion: PlanCriterionEntity;
      item: ScoreItemDto;
    }> = [];

    for (const item of items) {
      const criterion = byId.get(item.criteria_id);
      if (!criterion) {
        throw new BadRequestException(
          `Criterion #${item.criteria_id} does not belong to this plan`,
        );
      }
      if (seen.has(item.criteria_id)) {
        throw new BadRequestException(
          `Criterion #${item.criteria_id} was scored twice`,
        );
      }
      if (item.score > criterion.max_score) {
        throw new BadRequestException(
          `Score ${item.score} is above the maximum of ${criterion.max_score} for "${criterion.criteria_text}"`,
        );
      }
      seen.add(item.criteria_id);
      matched.push({ criterion, item });
    }

    const missing = criteria.filter((c) => !seen.has(c.criteria_id));
    if (missing.length) {
      throw new BadRequestException(
        `Every criterion must be scored. Missing: ${missing
          .map((c) => c.criteria_text)
          .join(', ')}`,
      );
    }

    return matched;
  }

    private async recipientNameOf(userId: number): Promise<string> {
    const user = await this.dataSource.getRepository(UserEntity).findOne({
      where: { user_id: userId },
      select: { first_name: true, last_name: true },
    });
    return user ? `${user.first_name} ${user.last_name}` : 'الموظف';
  }

}