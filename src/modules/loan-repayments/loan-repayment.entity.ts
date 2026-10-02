import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { PayrollEntity } from '../payroll/payroll.entity';
import { RepaymentStatus } from '../../common/enums/enums';

@Entity('loan_repayments')
@Unique(['request_id', 'installment_no'])
export class LoanRepaymentEntity {
  @PrimaryGeneratedColumn()
  repayment_id!: number;

  @Column()
  request_id!: number;

  @ManyToOne(() => RequestEntity)
  @JoinColumn({ name: 'request_id' })
  request!: RequestEntity;

  @Column({ type: 'int' })
  installment_no!: number;

  @Column({ type: 'date' })
  due_date!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: RepaymentStatus,
    default: RepaymentStatus.PENDING,
  })
  repayment_status!: RepaymentStatus;

  @Column({ type: 'datetime', nullable: true })
  paid_at!: Date;

  @Column({ nullable: true })
  payroll_id!: number;

  @ManyToOne(() => PayrollEntity, { nullable: true })
  @JoinColumn({ name: 'payroll_id' })
  payroll!: PayrollEntity;
}