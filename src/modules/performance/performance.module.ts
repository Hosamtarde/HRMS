import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CriteriaCategoryEntity } from './categories/criteria-category.entity';
import { EvaluationPlanEntity } from './plans/evaluation-plan.entity';
import { PlanCriterionEntity } from './plans/plan-criterion.entity';
import { PerformanceReviewEntity } from './reviews/performance-review.entity';
import { EvaluationScoreEntity } from './reviews/evaluation-score.entity';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';

import { CategoriesService } from './categories/categories.service';
import { PlansService } from './plans/plans.service';
import { ReviewsService } from './reviews/reviews.service';

import { CategoriesController } from './categories/categories.controller';
import { PlansController } from './plans/plans.controller';
import { ReviewsController } from './reviews/reviews.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CriteriaCategoryEntity,
      EvaluationPlanEntity,
      PlanCriterionEntity,
      PerformanceReviewEntity,
      EvaluationScoreEntity,
      EmployeeProfileEntity,
    ]),
  ],
  controllers: [CategoriesController, PlansController, ReviewsController],
  providers: [CategoriesService, PlansService, ReviewsService],
  exports: [CategoriesService, PlansService, ReviewsService],
})
export class PerformanceModule {}