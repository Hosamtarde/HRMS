import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { EvaluationPlanEntity } from './evaluation-plan.entity';
import { PlanCriterionEntity } from './plan-criterion.entity';
import { CriteriaCategoryEntity } from '../categories/criteria-category.entity';
import { PerformanceReviewEntity } from '../reviews/performance-review.entity';
import { EmployeeProfileEntity } from '../../employees/employee-profile.entity';
import { UserEntity } from '../../users/user.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CriterionDto } from './dto/criterion.dto';
import { DEFAULT_MAX_SCORE, TOTAL_WEIGHT } from '../performance.constants';
import { PlanStatus, ReviewStatus, Role } from '../../../common/enums/enums';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    @InjectRepository(EvaluationPlanEntity)
    private readonly plansRepository: Repository<EvaluationPlanEntity>,
    @InjectRepository(CriteriaCategoryEntity)
    private readonly categoriesRepository: Repository<CriteriaCategoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreatePlanDto,
    createdBy: number,
  ): Promise<EvaluationPlanEntity> {
    this.assertDatesMakeSense(dto);
    await this.assertCategoriesAreUsable(dto.criteria);

    const planId = await this.dataSource.transaction(async (manager) => {
      const plan = manager.create(EvaluationPlanEntity, {
        plan_name: dto.plan_name,
        description: dto.description,
        department_id: dto.department_id ,
        created_by: createdBy,
        period_start: dto.period_start,
        period_end: dto.period_end,
        submission_start: dto.submission_start,
        submission_end: dto.submission_end,
        plan_status: PlanStatus.DRAFT,
      });
      await manager.save(plan);

      const criteria = dto.criteria.map((criterion, index) =>
        manager.create(PlanCriterionEntity, {
          plan_id: plan.plan_id,
          category_id: criterion.category_id,
          criteria_text: criterion.criteria_text,
          weight: criterion.weight,
          max_score: criterion.max_score ?? DEFAULT_MAX_SCORE,
          display_order: criterion.display_order ?? index,
        }),
      );
      await manager.save(criteria);

      return plan.plan_id;
    });

    this.logger.log(
      `Evaluation plan #${planId} created as a draft with ${dto.criteria.length} criteria by user #${createdBy}`,
    );
    return this.findOne(planId);
  }


  async activate(id: number): Promise<EvaluationPlanEntity> {
    const created = await this.dataSource.transaction(async (manager) => {

      const plan = await manager.findOne(EvaluationPlanEntity, {
        where: { plan_id: id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!plan) {
        throw new NotFoundException(`Evaluation plan #${id} not found`);
      }
      if (plan.plan_status !== PlanStatus.DRAFT) {
        throw new BadRequestException(
          `Only a draft plan can be activated. This plan is already ${plan.plan_status}.`,
        );
      }

      const criteria = await manager.find(PlanCriterionEntity, {
        where: { plan_id: id },
      });
      this.assertWeightsTotalCorrectly(criteria);

      const userIds = await this.findEmployeesInScope(manager, plan);
      if (!userIds.length) {
        throw new BadRequestException(
          'No active employees fall within this plan. Activating it would create nothing to review.',
        );
      }

      const reviews = userIds.map((userId) =>
        manager.create(PerformanceReviewEntity, {
          plan_id: plan.plan_id,
          reviewed_user_id: userId,
          review_status: ReviewStatus.PENDING,
        }),
      );
      await manager.save(reviews);

      plan.plan_status = PlanStatus.ACTIVE;
      await manager.save(plan);

      return reviews.length;
    });

    this.logger.log(
      `Evaluation plan #${id} activated with ${created} pending reviews`,
    );
    return this.findOne(id);
  }

  async close(id: number): Promise<EvaluationPlanEntity> {
    const plan = await this.plansRepository.findOne({ where: { plan_id: id } });
    if (!plan) {
      throw new NotFoundException(`Evaluation plan #${id} not found`);
    }
    if (plan.plan_status !== PlanStatus.ACTIVE) {
      throw new BadRequestException(
        `Only an active plan can be closed. This plan is ${plan.plan_status}.`,
      );
    }
    plan.plan_status = PlanStatus.CLOSED;
    await this.plansRepository.save(plan);
    this.logger.log(`Evaluation plan #${id} closed`);
    return this.findOne(id);
  }

  async findOne(id: number): Promise<EvaluationPlanEntity> {
    const plan = await this.plansRepository.findOne({
      where: { plan_id: id },
      relations: { criteria: { category: true }, department: true },
      order: { criteria: { display_order: 'ASC' } },
    });
    if (!plan) {
      throw new NotFoundException(`Evaluation plan #${id} not found`);
    }
    return plan;
  }

  private assertDatesMakeSense(dto: CreatePlanDto): void {
    if (dto.period_end < dto.period_start) {
      throw new BadRequestException(
        'period_end must not be before period_start',
      );
    }
    if (dto.submission_end < dto.submission_start) {
      throw new BadRequestException(
        'submission_end must not be before submission_start',
      );
    }
    if (dto.submission_start < dto.period_start) {
      throw new BadRequestException(
        'Submission cannot open before the period being evaluated begins',
      );
    }
  }

  private async assertCategoriesAreUsable(
    criteria: CriterionDto[],
  ): Promise<void> {
    const ids = [...new Set(criteria.map((c) => c.category_id))];
    const found = await this.categoriesRepository.find({
      where: { category_id: In(ids) },
      select: { category_id: true, is_active: true, category_name: true },
    });

    const missing = ids.filter(
      (id) => !found.some((c) => c.category_id === id),
    );
    if (missing.length) {
      throw new BadRequestException(
        `Unknown criteria categories: ${missing.join(', ')}`,
      );
    }

    const inactive = found.filter((c) => !c.is_active);
    if (inactive.length) {
      throw new BadRequestException(
        `These categories are no longer active: ${inactive
          .map((c) => c.category_name)
          .join(', ')}`,
      );
    }
  }

  private assertWeightsTotalCorrectly(criteria: PlanCriterionEntity[]): void {
    if (!criteria.length) {
      throw new BadRequestException('A plan needs at least one criterion');
    }
    const total = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    if (Math.round(total * 100) !== TOTAL_WEIGHT * 100) {
      throw new BadRequestException(
        `Criteria weights must total ${TOTAL_WEIGHT}. Current total: ${total.toFixed(2)}.`,
      );
    }
  }


  private async findEmployeesInScope(
    manager: EntityManager,
    plan: EvaluationPlanEntity,
  ): Promise<number[]> {
    const query = manager
      .createQueryBuilder(EmployeeProfileEntity, 'profile')
      .innerJoin(UserEntity, 'user', 'user.user_id = profile.user_id')
      .select('profile.user_id', 'user_id')
      .where('user.status = :active', { active: true })
      .andWhere('user.role IN (:...roles)', {
        roles: [Role.EMPLOYEE, Role.MANAGER],
      });

    if (plan.department_id) {
      query.andWhere('profile.department_id = :departmentId', {
        departmentId: plan.department_id,
      });
    }

    const rows = await query.getRawMany<{ user_id: number }>();
    return rows.map((row) => row.user_id);
  }
}