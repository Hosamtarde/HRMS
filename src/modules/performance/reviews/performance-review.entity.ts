import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { EvaluationPlanEntity } from '../plans/evaluation-plan.entity';
import { EvaluationScoreEntity } from './evaluation-score.entity';
import { UserEntity } from '../../users/user.entity';
import { ReviewStatus } from '../../../common/enums/enums';


@Entity('performance_reviews')
@Unique(['plan_id', 'reviewed_user_id'])
@Index(['reviewed_user_id', 'review_status'])
@Index(['plan_id', 'review_status'])
export class PerformanceReviewEntity {
  @PrimaryGeneratedColumn()
  review_id!: number;

  @Column()
  plan_id!: number;

  @ManyToOne(() => EvaluationPlanEntity)
  @JoinColumn({ name: 'plan_id' })
  plan!: EvaluationPlanEntity;

  @Column()
  reviewed_user_id!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reviewed_user_id' })
  reviewedUser!: UserEntity;

  @Column({ nullable: true })
  reviewed_by!: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer!: UserEntity;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  review_status!: ReviewStatus;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  total_score!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  final_percentage!: number;

  @Column({ type: 'text', nullable: true })
  reviewer_comment!: string;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at!: Date;

  @OneToMany(() => EvaluationScoreEntity, (score) => score.review, {
    cascade: true,
  })
  scores!: EvaluationScoreEntity[];

  @CreateDateColumn()
  created_at!: Date;
}