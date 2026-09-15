import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Entity('payroll_records')
export class PayrollEntity {
  @PrimaryGeneratedColumn()
  payroll_id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basic_salary!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  bonuses!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deductions!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  net_salary!: number;

  @Column({ type: 'date' })
  salary_month!: string;

  @CreateDateColumn()
  generated_at!: Date;
}