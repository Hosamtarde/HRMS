import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { DepartmentEntity } from '../../departments/department.entity';
import { UserEntity } from '../../users/user.entity';
import { PlanCriterionEntity } from './plan-criterion.entity';
import { PlanStatus } from '../../../common/enums/enums';

@Entity('evaluation_plans')
export class EvaluationPlanEntity {
  @PrimaryGeneratedColumn()
  plan_id!: number;

  @Column({ length: 150 })
  plan_name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  department_id!: number;

  @ManyToOne(() => DepartmentEntity, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department!: DepartmentEntity;

  @Column()
  created_by!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator!: UserEntity;

  @Column({ type: 'date' })
  period_start!: string;

  @Column({ type: 'date' })
  period_end!: string;

  @Column({ type: 'date' })
  submission_start!: string;

  @Column({ type: 'date' })
  submission_end!: string;

  @Column({ type: 'enum', enum: PlanStatus, default: PlanStatus.DRAFT })
  plan_status!: PlanStatus;

  @OneToMany(() => PlanCriterionEntity, (criterion) => criterion.plan, {
    cascade: true,
  })
  criteria!: PlanCriterionEntity[];

  @CreateDateColumn()
  created_at!: Date;
}