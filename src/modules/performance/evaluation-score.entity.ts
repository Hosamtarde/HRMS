import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PerformanceReviewEntity } from './performance-review.entity';
import { PlanCriterionEntity } from './plan-criterion.entity';

@Entity('evaluation_scores')
export class EvaluationScoreEntity {
  @PrimaryColumn()
  review_id!: number;

  @PrimaryColumn()
  criteria_id!: number;

  @ManyToOne(() => PerformanceReviewEntity, (review) => review.scores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'review_id' })
  review!: PerformanceReviewEntity;

  @ManyToOne(() => PlanCriterionEntity)
  @JoinColumn({ name: 'criteria_id' })
  criterion!: PlanCriterionEntity;

  @Column()
  score!: number;

  @Column({ length: 255, nullable: true })
  note!: string;
}