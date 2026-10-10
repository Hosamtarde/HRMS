import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriaCategoryEntity } from './criteria-category.entity';
import { EvaluationPlanEntity } from './evaluation-plan.entity';
import { PlanCriterionEntity } from './plan-criterion.entity';
import { PerformanceCategoriesService } from './performance-categories.service';
import { PerformanceCategoriesController } from './performance-categories.controller';
import { PerformanceReviewEntity } from './performance-review.entity';
import { EvaluationScoreEntity } from './evaluation-score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CriteriaCategoryEntity,
      EvaluationPlanEntity,
      PlanCriterionEntity,
      PerformanceReviewEntity,
      EvaluationScoreEntity,
    ]),
  ],
  controllers: [PerformanceCategoriesController],
  providers: [PerformanceCategoriesService],
  exports: [PerformanceCategoriesService],
})
export class PerformanceModule {}