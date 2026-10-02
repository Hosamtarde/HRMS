import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { LeaveTypeEntity } from '../leave-types/leave-type.entity';

@Entity('leave_balances')
@Unique(['user_id', 'leave_type_id', 'year'])
export class LeaveBalanceEntity {
  @PrimaryGeneratedColumn()
  balance_id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column()
  leave_type_id!: number;

  @ManyToOne(() => LeaveTypeEntity)
  @JoinColumn({ name: 'leave_type_id' })
  leaveType!: LeaveTypeEntity;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  total_days!: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  carried_over!: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  used_days!: number;

  @Column({ type: 'boolean', default: false })
  is_manual!: boolean;
}