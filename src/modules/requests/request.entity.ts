import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { RequestType, RequestStatus } from '../../common/enums/enums';
import { LeaveTypeEntity } from '../leave-types/leave-type.entity';

@Entity('requests')
export class RequestEntity {
  @PrimaryGeneratedColumn()
  request_id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'enum', enum: RequestType })
  request_type!: RequestType;

  @Column({ length: 150, nullable: true })
  request_title!: string;

  @Column({ nullable: true })
  leave_type_id!: number;

  @ManyToOne(() => LeaveTypeEntity, { nullable: true })
  @JoinColumn({ name: 'leave_type_id' })
  leaveType!: LeaveTypeEntity;

  @Column({ type: 'date', nullable: true })
  start_date!: string;

  @Column({ type: 'date', nullable: true })
  end_date!: string;

  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  loan_amount!: number;

  @Column({ nullable: true })
  repayment_period!: number; 


  @Column({ type: 'text' })
  reason!: string;

  @Column({ nullable: true })
  attachment!: string;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  request_status!: RequestStatus;

  @Column({ nullable: true })
  reviewed_by!: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer!: UserEntity;

  @CreateDateColumn()
  created_at!: Date;
}