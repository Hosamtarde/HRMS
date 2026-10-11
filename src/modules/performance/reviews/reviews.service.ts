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
import { PlanStatus, ReviewStatus, Role } from '../../../common/enums/enums';

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
  ) {}

  async submit(
    reviewId: number,
    dto: SubmitReviewDto,
    reviewer: Reviewer,
  ): Promise<PerformanceReviewEntity> {
    await this.dataSource.transaction(async (manager) => {
    
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
    });

    return this.findOne(reviewId);
  }

  async findOne(id: number): Promise<PerformanceReviewEntity> {
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
    return review;
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
}