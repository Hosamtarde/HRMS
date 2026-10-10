import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriaCategoryEntity } from './criteria-category.entity';
import { EvaluationPlanEntity } from './evaluation-plan.entity';
import { PlanCriterionEntity } from './plan-criterion.entity';
import { PerformanceCategoriesService } from './performance-categories.service';
import { PerformanceCategoriesController } from './performance-categories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CriteriaCategoryEntity,
      EvaluationPlanEntity,
      PlanCriterionEntity,
    ]),
  ],
  controllers: [PerformanceCategoriesController],
  providers: [PerformanceCategoriesService],
  exports: [PerformanceCategoriesService],
})
export class PerformanceModule {}