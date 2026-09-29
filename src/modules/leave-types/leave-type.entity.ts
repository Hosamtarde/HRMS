import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { PaymentType } from '../../common/enums/enums';

@Entity('leave_types')
export class LeaveTypeEntity {
  @PrimaryGeneratedColumn()
  leave_type_id!: number;

  @Column({ length: 100, unique: true })
  type_name!: string;

  @Column({ type: 'enum', enum: PaymentType })
  payment_type!: PaymentType;

  @Column({ type: 'int' })
  default_days!: number;

  @CreateDateColumn()
  created_at!: Date;
}