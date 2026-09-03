import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { DepartmentEntity } from '../departments/department.entity';
import { EmploymentType } from '../../common/enums/enums';


@Entity('employee_profiles')
export class EmployeeProfileEntity {
  @PrimaryColumn()
  user_id!: number;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ nullable: true })
  department_id!: number;

  @ManyToOne(() => DepartmentEntity, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department!: DepartmentEntity;

  @Column({ length: 100 })
  position!: string;

  @Column({ type: 'date' })
  hire_date!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basic_salary!: number;

  @Column({ type: 'enum', enum: EmploymentType, default: EmploymentType.FULL_TIME })
  employment_type!: EmploymentType;
}