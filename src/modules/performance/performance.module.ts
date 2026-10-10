import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriaCategoryEntity } from './criteria-category.entity';
import { EvaluationPlanEntity } from './evaluation-plan.entity';
import { PlanCriterionEntity } from './plan-criterion.entity';
import { PerformanceCategoriesService } from './performance-categories.service';
import { PerformanceCategoriesController } from './performance-categories.controller';
import { PerformanceReviewEntity } from './performance-review.entity';
import { EvaluationScoreEntity } from './evaluation-score.entity';
import { PerformancePlansService } from './performance-plans.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CriteriaCategoryEntity,
      EvaluationPlanEntity,
      PlanCriterionEntity,
      PerformanceReviewEntity,
      EvaluationScoreEntity,
      PerformancePlansService,
    ]),
  ],
  controllers: [PerformanceCategoriesController],
  providers: [PerformanceCategoriesService],
  exports: [PerformanceCategoriesService],
})
export class PerformanceModule {}