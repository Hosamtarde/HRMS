import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { ActivityAction } from '../../common/enums/enums';

@Entity('activity_logs')
export class ActivityLogEntity {
  @PrimaryGeneratedColumn()
  log_id!: number;

  @Column({ nullable: true })
  user_id!: number;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'enum', enum: ActivityAction })
  action!: ActivityAction;

  @Column({ length: 50 })
  entity!: string;

  @Column({ nullable: true })
  entity_id!: number;

  @Column({ length: 10 })
  method!: string;

  @Column({ length: 255 })
  path!: string;

  @CreateDateColumn()
  created_at!: Date;
}