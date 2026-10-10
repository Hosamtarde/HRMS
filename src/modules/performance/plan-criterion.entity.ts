import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EvaluationPlanEntity } from './evaluation-plan.entity';
import { CriteriaCategoryEntity } from './criteria-category.entity';
import { DEFAULT_MAX_SCORE } from './performance.constants';

@Entity('plan_criteria')
@Index(['plan_id', 'display_order'])
export class PlanCriterionEntity {
  @PrimaryGeneratedColumn()
  criteria_id!: number;

  @Column()
  plan_id!: number;

  @ManyToOne(() => EvaluationPlanEntity, (plan) => plan.criteria, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan!: EvaluationPlanEntity;

  @Column()
  category_id!: number;

  @ManyToOne(() => CriteriaCategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category!: CriteriaCategoryEntity;

  @Column({ length: 255 })
  criteria_text!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight!: number;

  @Column({ default: DEFAULT_MAX_SCORE })
  max_score!: number;

  @Column({ default: 0 })
  display_order!: number;
}