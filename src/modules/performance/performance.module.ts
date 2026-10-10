import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriaCategoryEntity } from './categories/criteria-category.entity';
import { EvaluationPlanEntity } from './plans/evaluation-plan.entity';
import { PlanCriterionEntity } from './plans/plan-criterion.entity';
import { CategoriesService } from './categories/categories.service';
import { CategoriesController } from './categories/categories.controller';
import { PerformanceReviewEntity } from './reviews/performance-review.entity';
import { EvaluationScoreEntity } from './reviews/evaluation-score.entity';
import { PlansService } from './plans/plans.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CriteriaCategoryEntity,
      EvaluationPlanEntity,
      PlanCriterionEntity,
      PerformanceReviewEntity,
      EvaluationScoreEntity,
      PlansService,
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class PerformanceModule {}