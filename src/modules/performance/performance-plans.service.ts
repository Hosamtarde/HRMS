import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { EvaluationPlanEntity } from './evaluation-plan.entity';
import { PlanCriterionEntity } from './plan-criterion.entity';
import { CriteriaCategoryEntity } from './criteria-category.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CriterionDto } from './dto/criterion.dto';
import { DEFAULT_MAX_SCORE } from './performance.constants';
import { PlanStatus } from '../../common/enums/enums';

@Injectable()
export class PerformancePlansService {
  private readonly logger = new Logger(PerformancePlansService.name);

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
}